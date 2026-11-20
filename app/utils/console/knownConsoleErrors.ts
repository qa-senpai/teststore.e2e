/** Known non-bug errors. Match by message and optional source URL; document why. */
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
  if (typeof pattern === 'string') return value.includes(pattern);
  pattern.lastIndex = 0;
  return pattern.test(value);
}
