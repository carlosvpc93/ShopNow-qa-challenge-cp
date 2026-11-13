/** Formats a number the way the spec requires: dollars with two decimals, e.g. 25.05 → "$25.05". */
export function usd(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
