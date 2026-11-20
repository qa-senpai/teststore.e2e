import { test as base, type Page } from '@playwright/test';
import { checkPageConsoleError } from '../../app/utils/console/checkPageConsoleError';
import {
  ConsoleErrorRule,
  knownConsoleErrors,
} from '../../app/utils/console/knownConsoleErrors';

export type { ConsoleErrorRule } from '../../app/utils/console/knownConsoleErrors';

type ConsoleOptions = {
  /** Fail the test after it finishes if it logged console errors. Default: FAIL_ON_CONSOLE_ERRORS env var. */
  failOnConsoleErrors: boolean;
  /** Extra known errors for a test/describe, on top of `knownConsoleErrors`. */
  ignoredConsoleErrors: ConsoleErrorRule[];
};

type ConsoleFixtures = {
  consoleErrors: { errors: string[] };
};

const envFlag = (value: string | undefined): boolean =>
  /^(1|true|yes|on)$/i.test(value?.trim() ?? '');

export const test = base.extend<ConsoleFixtures & ConsoleOptions>({
  failOnConsoleErrors: [
    envFlag(process.env.FAIL_ON_CONSOLE_ERRORS),
    { option: true },
  ],
  ignoredConsoleErrors: [[], { option: true }],

  consoleErrors: [
    async (
      { context, failOnConsoleErrors, ignoredConsoleErrors },
      use,
      testInfo,
    ) => {
      const errors: string[] = [];
      const rules = [...knownConsoleErrors, ...ignoredConsoleErrors];
      const cleanups: (() => void)[] = [];
      const onPage = (page: Page) => {
        cleanups.push(checkPageConsoleError(page, errors, rules));
      };
      context.on('page', onPage);
      context.pages().forEach(onPage);

      await use({ errors });
      context.off('page', onPage);
      cleanups.forEach((cleanup) => cleanup());

      if (errors.length === 0) return;

      const report = `${errors.length} console error(s) found.\n\n${errors.join('\n\n')}`;

      await testInfo.attach('console-errors.txt', {
        body: report,
        contentType: 'text/plain',
      });

      const passedSoFar = testInfo.status === testInfo.expectedStatus;

      if (failOnConsoleErrors && passedSoFar) {
        throw new Error(report);
      }
      console.warn(`[${testInfo.title}] ${report}`);
    },
    { auto: true, box: true, title: 'console error tracker' },
  ],
});
