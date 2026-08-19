/**
 * Formats a number as USD currency.
 * Handles NaN, null, undefined, or non-numeric values gracefully by returning $0.00.
 *
 * @param amount - The number to format
 * @param currency - Optional currency code (default: "USD")
 * @returns Formatted currency string, e.g., "$1,234.56"
 */
export const formatMoney = (
  amount: number | null | undefined,
  currency: string = "USD"
): string => {
  const value = typeof amount === "number" && isFinite(amount) ? amount : 0;
  const locale =
    currency === "INR" ? "en-IN" :
    currency === "AED" ? "en-AE" :
    "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if ICU doesn’t know the currency
    const symbol =
      currency === "INR" ? "₹" :
      currency === "AED" ? "AED" :
      currency === "USD" ? "$" :
      currency;
    return `${symbol} ${value.toFixed(2)}`;
  }
};


/**
 * Formats a number as currency without the currency symbol (e.g., for inputs).
 * Useful for displaying amounts in forms.
 */
export const formatMoneyWithoutSymbol = (
  amount: number | null | undefined
): string => {
  const value = typeof amount === "number" && isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Parses a formatted currency string back to a number.
 * e.g., "$1,234.56" → 1234.56
 */
export const parseMoney = (formatted: string): number => {
  const cleaned = formatted.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
};