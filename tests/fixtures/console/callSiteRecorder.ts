import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * Remembers which line of OUR code (tests, page objects, fixtures) made the most recent
 * Playwright call, so a console error can be tied to "what the test was doing at that moment".
 *
 * Playwright has no public "current action" API, so the methods of Page, Locator, Keyboard,
 * Mouse (and Frame._expect, used by `expect(page)`) are wrapped once per worker. A wrapper
 * captures the JS stack, keeps only frames from this repo and stores them as the last call
 * site. Workers run one test at a time, so a module-level variable is enough.
 */

export type CodeFrame = {
  fn?: string;
  file: string; // repo-relative
  line: number;
  column: number;
};

export type CallSite = {
  api: string; // e.g. locator('#search').fill("dress")
  frames: CodeFrame[]; // innermost first, our code only
  startedAt: number;
  settledAt?: number;
  failed?: boolean;
};

const ROOT = process.cwd();
const SELF_DIR = __dirname;
const patched = new WeakSet<object>();
let lastCall: CallSite | undefined;
let paused = 0;
let depth = 0;

export function resetLastCall(): void {
  lastCall = undefined;
}

export function getLastCall(): CallSite | undefined {
  return lastCall ? { ...lastCall, frames: [...lastCall.frames] } : undefined;
}

/** Runs Playwright calls made by the tracker itself (screenshot, url) without recording them. */
export function withoutRecording<T>(fn: () => T): T {
  paused++;
  try {
    return fn();
  } finally {
    paused--;
  }
}

export function installCallSiteRecorder(page: Page): void {
  patchPrototype(Object.getPrototypeOf(page), "page");
  patchPrototype(Object.getPrototypeOf(page.locator("html")), "locator");
  patchPrototype(Object.getPrototypeOf(page.keyboard), "keyboard");
  patchPrototype(Object.getPrototypeOf(page.mouse), "mouse");
  // expect(page).toHaveTitle / toHaveURL go through the main frame.
  patchPrototype(Object.getPrototypeOf(page.mainFrame()), "frame", [
    "_expect",
    "waitForURL",
  ]);
}

function patchPrototype(
  proto: Record<string, unknown>,
  label: string,
  only?: string[],
): void {
  if (patched.has(proto)) return;
  patched.add(proto);

  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === "constructor") continue;
    if (
      only ? !only.includes(name) : name.startsWith("_") && name !== "_expect"
    )
      continue;
    const descriptor = Object.getOwnPropertyDescriptor(proto, name);
    if (!descriptor || typeof descriptor.value !== "function") continue;

    const original = descriptor.value as (...args: unknown[]) => unknown;
    proto[name] = function (this: unknown, ...args: unknown[]) {
      // Nested calls made synchronously by Playwright itself are not interesting.
      const record = paused === 0 && depth === 0;
      const stack = record ? captureStack() : undefined;
      depth++;
      let result: unknown;
      try {
        result = original.apply(this, args);
      } finally {
        depth--;
      }
      if (stack && isThenable(result)) {
        const frames = parseFrames(stack);
        if (frames.length > 0) {
          const site: CallSite = {
            api: describeCall(label, name, this, args),
            frames,
            startedAt: Date.now(),
          };
          lastCall = site;
          result.then(
            () => (site.settledAt = Date.now()),
            () => {
              site.settledAt = Date.now();
              site.failed = true;
            },
          );
        }
      }
      return result;
    };
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof (value as PromiseLike<unknown>).then === "function";
}

function captureStack(): string {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 40;
  const stack = new Error().stack ?? "";
  Error.stackTraceLimit = limit;
  return stack;
}

const FRAME_RE = /^\s*at (?:(.*?) \()?(.+?):(\d+):(\d+)\)?$/;

function parseFrames(stack: string): CodeFrame[] {
  const frames: CodeFrame[] = [];
  for (const raw of stack.split("\n").slice(1)) {
    const match = FRAME_RE.exec(raw);
    if (!match) continue;
    const file = match[2].replace(/^file:\/\//, "");
    if (!file.startsWith(ROOT) || file.includes("node_modules")) continue;
    if (file.startsWith(SELF_DIR)) continue; // the tracker itself
    frames.push({
      fn: match[1]?.replace(/^async /, ""),
      file: path.relative(ROOT, file),
      line: Number(match[3]),
      column: Number(match[4]),
    });
  }
  return frames;
}

function describeCall(
  label: string,
  name: string,
  self: unknown,
  args: unknown[],
): string {
  if (name === "_expect") {
    const target =
      label === "locator" ? `expect(${safeString(self)})` : "expect(page)";
    return `${target} ${String(args[0] ?? "")}`.trim();
  }
  const target = label === "locator" ? safeString(self) : label;
  const shown = args
    .filter((a) => typeof a === "string" || typeof a === "number")
    .map((a) => truncate(JSON.stringify(a), 80));
  return `${target}.${name}(${shown.join(", ")})`;
}

function safeString(value: unknown): string {
  try {
    return withoutRecording(() => String(value));
  } catch {
    return "locator";
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const sourceCache = new Map<string, string[] | null>();

/** A few lines of source around `frame`, with the executing line marked by `>`. */
export function codeSnippet(frame: CodeFrame, around = 3): string {
  if (!sourceCache.has(frame.file)) {
    try {
      sourceCache.set(
        frame.file,
        fs.readFileSync(path.join(ROOT, frame.file), "utf8").split("\n"),
      );
    } catch {
      sourceCache.set(frame.file, null);
    }
  }
  const lines = sourceCache.get(frame.file);
  if (!lines) return "  (source not available)";

  const from = Math.max(1, frame.line - around);
  const to = Math.min(lines.length, frame.line + around);
  const width = String(to).length;
  const out: string[] = [];
  for (let n = from; n <= to; n++) {
    const marker = n === frame.line ? ">" : " ";
    out.push(`${marker} ${String(n).padStart(width)} | ${lines[n - 1]}`);
    if (n === frame.line) {
      out.push(
        `  ${" ".repeat(width)} | ${" ".repeat(Math.max(0, frame.column - 1))}^`,
      );
    }
  }
  return out.join("\n");
}
