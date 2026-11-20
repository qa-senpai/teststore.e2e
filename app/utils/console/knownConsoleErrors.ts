/**
 * Console errors that are known and NOT bugs of the shop under test.
 * Matching errors are still listed in the `console-errors-ignored` attachment
 * but never fail a test and never get a screenshot.
 *
 * - `message` — substring or RegExp matched against the error text.
 * - `url` (optional) — substring or RegExp matched against the script/resource URL
 *   that produced the error or, if the browser gave none, the page URL.
 * - `reason` — why it is safe to ignore (required, so the list stays reviewable).
 *
 * Add a rule for a single test or describe block with
 * `test.use({ ignoredConsoleErrors: [{ message: /.../, reason: '...' }] })`.
 */
export type ConsoleErrorRule = {
  message: string | RegExp;
  url?: string | RegExp;
  reason: string;
};

export const knownConsoleErrors: ConsoleErrorRule[] = [
  // Add rules here, e.g.:
  // {
  //   message: 'Failed to load resource: the server responded with a status of 404',
  //   url: /\/modules\/ps_facebook\//,
  //   reason: 'Third-party module asset missing on the demo shop, not part of the tested flow',
  // },
];

export function matchesRule(
  rule: ConsoleErrorRule,
  text: string,
  url: string,
): boolean {
  return matches(rule.message, text) && (!rule.url || matches(rule.url, url));
}

function matches(pattern: string | RegExp, value: string): boolean {
  return typeof pattern === 'string'
    ? value.includes(pattern)
    : pattern.test(value);
}
