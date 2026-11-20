import { test as base } from "@playwright/test";
import { ConsoleErrorTracker } from "./console/ConsoleErrorTracker";
import {
  ConsoleErrorRule,
  knownConsoleErrors,
} from "./console/knownConsoleErrors";

export type { ConsoleErrorRule } from "./console/knownConsoleErrors";

type ConsoleOptions = {
  /** Fail the test after it finishes if it logged console errors. Default: FAIL_ON_CONSOLE_ERRORS env var. */
  failOnConsoleErrors: boolean;
  /** Extra known errors for a test/describe, on top of `knownConsoleErrors`. */
  ignoredConsoleErrors: ConsoleErrorRule[];
};

type ConsoleFixtures = {
  consoleErrors: ConsoleErrorTracker;
};

const envFlag = (value: string | undefined): boolean =>
  /^(1|true|yes|on)$/i.test(value?.trim() ?? "");

export const test = base.extend<ConsoleFixtures & ConsoleOptions>({
  failOnConsoleErrors: [
    envFlag(process.env.FAIL_ON_CONSOLE_ERRORS),
    { option: true },
  ],
  ignoredConsoleErrors: [[], { option: true }],

  // Auto fixture: runs for every test, never interrupts it, reports after it.
  consoleErrors: [
    async (
      { context, failOnConsoleErrors, ignoredConsoleErrors },
      use,
      testInfo,
    ) => {
      const tracker = new ConsoleErrorTracker(context, testInfo, [
        ...knownConsoleErrors,
        ...ignoredConsoleErrors,
      ]);
      tracker.start();

      await use(tracker);

      await tracker.stop();
      await tracker.attachReport();

      if (tracker.errors.length === 0) return;
      const passedSoFar = testInfo.status === testInfo.expectedStatus;
      if (failOnConsoleErrors && passedSoFar) {
        throw new Error(tracker.summary(true));
      }
      // Not failing: still make it visible in the terminal output of the run.
      console.warn(
        `[${testInfo.titlePath.slice(1).join(" › ")}] ${tracker.summary(false)}`,
      );
    },
    { auto: true, box: true, title: "console error tracker" },
  ],
});
