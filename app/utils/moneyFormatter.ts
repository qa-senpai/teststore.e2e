/** Parse displayed USD amounts into cents so totals use integer arithmetic. */
export function usdToCents(text: string): number {
  const match = /^\$([\d,]+)\.(\d{2})$/.exec(text.trim());
  if (!match) throw new Error(`Invalid USD amount: ${text}`);
  return Number(match[1].replace(/,/g, '')) * 100 + Number(match[2]);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
