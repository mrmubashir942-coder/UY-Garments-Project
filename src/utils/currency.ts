/**
 * Centralized currency-formatting utility for Pakistani Rupees (PKR / Rs.)
 * Standard Pakistan locale: en-PK
 * Formats consistently, e.g.:
 *   Rs. 2,500.00
 *   Rs. 15,000.00
 *   Rs. 125,500.00
 */

export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs.';

export interface FormatPKROptions {
  showSymbol?: boolean;
  showDecimals?: boolean;
}

/**
 * Format a numeric amount into standard Pakistani Rupee representation.
 * @param amount Number to format
 * @param options showSymbol (default: true), showDecimals (default: true)
 */
export function formatPKR(
  amount: number | null | undefined,
  options: FormatPKROptions = {}
): string {
  const { showSymbol = true, showDecimals = true } = options;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formattedNum = absNum.toLocaleString('en-PK', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  if (isNegative) {
    return showSymbol ? `-Rs. ${formattedNum}` : `-${formattedNum}`;
  }

  return showSymbol ? `Rs. ${formattedNum}` : formattedNum;
}

/**
 * Alias for backward compatibility or generic format calls.
 */
export function formatCurrency(
  amount: number | null | undefined,
  _symbolOverride?: string,
  options?: FormatPKROptions
): string {
  return formatPKR(amount, options);
}
