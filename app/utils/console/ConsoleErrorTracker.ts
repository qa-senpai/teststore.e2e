import type {
  BrowserContext,
  ConsoleMessage,
  Page,
  TestInfo,
  WebError,
} from '@playwright/test';
import {
  CallSite,
  codeSnippet,
  getLastCall,
  installCallSiteRecorder,
  resetLastCall,
  withoutRecording,
} from './callSiteRecorder';
import { ConsoleErrorRule, matchesRule } from './knownConsoleErrors';

export type ConsoleErrorKind = 'console.error' | 'pageerror';

export type ConsoleErrorEntry = {
  index: number;
  kind: ConsoleErrorKind;
  text: string;
  stack?: string; // browser-side stack, for uncaught exceptions
  source?: string; // script/resource url:line:col reported by the browser
  pageUrl: string;
  elapsedMs: number; // since the test started
  callSite?: CallSite;
  screenshotName?: string;
  ignoredBy?: ConsoleErrorRule;
};

const MAX_SCREENSHOTS = 20;
/** Errors fired within this window share one screenshot (one broken action often logs many). */
const SCREENSHOT_BURST_MS = 300;

/**
 * Collects browser console errors and uncaught page exceptions for every page of a context
 * without interrupting the test. After the test it attaches a text report and the screenshots
 * to the HTML report and can fail the test (see `failOnConsoleErrors`).
 */
export class ConsoleErrorTracker {
  readonly errors: ConsoleErrorEntry[] = [];
  readonly ignored: ConsoleErrorEntry[] = [];

  private readonly startedAt = Date.now();
  private readonly screenshots: Promise<void>[] = [];
  private lastShot?: { page: Page; at: number; name: string };
  private shotCount = 0;
  private counter = 0;

  constructor(
    private readonly context: BrowserContext,
    private readonly testInfo: TestInfo,
    private readonly rules: ConsoleErrorRule[],
  ) {}

  private readonly onPage = (page: Page) => installCallSiteRecorder(page);

  private readonly onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const { url, lineNumber, columnNumber } = msg.location();
    this.record(msg.page(), {
      kind: 'console.error',
      text: msg.text(),
      source: url ? `${url}:${lineNumber + 1}:${columnNumber + 1}` : undefined,
    });
  };

  private readonly onWebError = (webError: WebError) => {
    const error = webError.error();
    this.record(webError.page(), {
      kind: 'pageerror',
      text: `${error.name}: ${error.message}`,
      stack: error.stack,
    });
  };

  start(): void {
    resetLastCall();
    this.context.pages().forEach(this.onPage);
    this.context.on('page', this.onPage);
    this.context.on('console', this.onConsole);
    this.context.on('weberror', this.onWebError);
  }

  async stop(): Promise<void> {
    this.context.off('page', this.onPage);
    this.context.off('console', this.onConsole);
    this.context.off('weberror', this.onWebError);
    await Promise.allSettled(this.screenshots);
  }

  private record(
    page: Page | null,
    data: Pick<ConsoleErrorEntry, 'kind' | 'text' | 'stack' | 'source'>,
  ): void {
    const pageUrl = page ? withoutRecording(() => page.url()) : '(no page)';
    const entry: ConsoleErrorEntry = {
      ...data,
      index: 0,
      pageUrl,
      elapsedMs: Date.now() - this.startedAt,
      callSite: getLastCall(),
    };

    const sourceUrl = data.source ?? pageUrl;
    entry.ignoredBy = this.rules.find((rule) =>
      matchesRule(rule, data.text, sourceUrl),
    );
    if (entry.ignoredBy) {
      entry.index = this.ignored.push(entry);
      return;
    }

    entry.index = ++this.counter;
    this.errors.push(entry);
    if (page) entry.screenshotName = this.screenshot(page, entry.index);
  }

  /** Starts the screenshot right away so it shows the page at the moment of the error. */
  private screenshot(page: Page, index: number): string | undefined {
    const now = Date.now();
    if (
      this.lastShot &&
      this.lastShot.page === page &&
      now - this.lastShot.at < SCREENSHOT_BURST_MS
    ) {
      return this.lastShot.name;
    }
    if (this.shotCount >= MAX_SCREENSHOTS || page.isClosed()) return undefined;

    this.shotCount++;
    const name = `console-error-${index}.png`;
    this.lastShot = { page, at: now, name };
    this.screenshots.push(
      withoutRecording(() =>
        page.screenshot({ timeout: 5_000, animations: 'disabled' }),
      ).then(
        (body) =>
          this.testInfo.attach(name, { body, contentType: 'image/png' }),
        () => undefined, // page navigated away / closed — the text report is still there
      ),
    );
    return name;
  }

  async attachReport(): Promise<void> {
    if (this.errors.length > 0) {
      this.testInfo.annotations.push({
        type: 'console errors',
        description: `${this.errors.length} console error(s) — see the "console-errors.txt" attachment`,
      });
      await this.testInfo.attach('console-errors.txt', {
        body: this.formatReport(),
        contentType: 'text/plain',
      });
    }
    if (this.ignored.length > 0) {
      await this.testInfo.attach('console-errors-ignored.txt', {
        body: this.ignored
          .map(
            (e) =>
              `#${e.index} [${e.kind}] ${e.text}\n  page: ${e.pageUrl}\n  ignored: ${e.ignoredBy?.reason}`,
          )
          .join('\n\n'),
        contentType: 'text/plain',
      });
    }
  }

  /** Short message for the terminal / the failure when FAIL_ON_CONSOLE_ERRORS is on. */
  summary(failing: boolean): string {
    const lines = this.errors.map(
      (e) =>
        `  #${e.index} [${e.kind}] ${firstLine(e.text)}\n      at ${e.callSite?.frames[0] ? frameRef(e.callSite.frames[0]) : e.pageUrl}`,
    );
    return [
      `${this.errors.length} console error(s) found${failing ? ' (FAIL_ON_CONSOLE_ERRORS is on)' : ''}. Details and screenshots are in the HTML report attachments.`,
      ...lines,
    ].join('\n');
  }

  formatReport(): string {
    const header = [
      `Test:    ${this.testInfo.titlePath.join(' › ')}`,
      `Project: ${this.testInfo.project.name}`,
      `File:    ${this.testInfo.file}`,
      `Errors:  ${this.errors.length}${this.ignored.length ? ` (+${this.ignored.length} ignored as known)` : ''}`,
    ].join('\n');
    return [header, ...this.errors.map(formatEntry)].join(
      `\n\n${'='.repeat(80)}\n\n`,
    );
  }
}

function formatEntry(e: ConsoleErrorEntry): string {
  const out = [
    `#${e.index} [${e.kind}] at +${(e.elapsedMs / 1000).toFixed(2)}s`,
    '',
    'Message:',
    indent(e.text),
  ];
  if (e.stack && e.stack !== e.text)
    out.push('', 'Browser stack:', indent(e.stack));
  out.push('', `Page URL:  ${e.pageUrl}`);
  if (e.source) out.push(`Source:    ${e.source}`);
  out.push(
    `Screenshot: ${e.screenshotName ?? '(not taken: page closed or screenshot limit reached)'}`,
  );

  const site = e.callSite;
  out.push('', 'Test code running at that moment:');
  if (!site) {
    out.push('  (no Playwright call made yet by the test)');
    return out.join('\n');
  }
  out.push(`  Last Playwright call: ${site.api}`);
  out.push(`  State: ${callState(site)}`);
  out.push('  Call chain (innermost first):');
  site.frames.forEach((f) =>
    out.push(`    at ${f.fn ? `${f.fn} ` : ''}(${frameRef(f)})`),
  );
  // Snippets for the innermost frame (page object) and the test itself.
  const shown = new Set<string>();
  for (const frame of [site.frames[0], site.frames[site.frames.length - 1]]) {
    const key = frameRef(frame);
    if (shown.has(key)) continue;
    shown.add(key);
    out.push('', `  ${key}`, indent(codeSnippet(frame), 2));
  }
  return out.join('\n');
}

// `site` is a snapshot taken when the error was logged, so settledAt reflects that moment.
function callState(site: CallSite): string {
  return site.settledAt === undefined
    ? 'in progress when the error was logged'
    : `finished${site.failed ? ' (with an error)' : ''} before the error was logged — the error came from page activity after it`;
}

function frameRef(f: { file: string; line: number; column: number }): string {
  return `${f.file}:${f.line}:${f.column}`;
}

function firstLine(text: string): string {
  const line = text.split('\n')[0];
  return line.length > 160 ? `${line.slice(0, 159)}…` : line;
}

function indent(text: string, spaces = 2): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((l) => pad + l)
    .join('\n');
}
