import type { ConsoleMessage, Page } from '@playwright/test';
import {
  type ConsoleErrorRule,
  knownConsoleErrors,
  matchesRule,
} from './knownConsoleErrors';

export function checkPageConsoleError(
  page: Page,
  errors: string[],
  ignoredConsoleErrors: ConsoleErrorRule[] = knownConsoleErrors,
): () => void {
  const recordError = (message: string, type: string, source = page.url()) => {
    if (ignoredConsoleErrors.some((rule) => matchesRule(rule, message, source)))
      return;

    errors.push(`[${type}] ${message}\nPage: ${page.url()}\nSource: ${source}`);
  };

  const onConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    recordError(
      message.text(),
      'console.error',
      message.location().url || page.url(),
    );
  };

  const onPageError = (error: Error) => {
    recordError(`${error.name}: ${error.message}`, 'pageerror');
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  return () => {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  };
}
