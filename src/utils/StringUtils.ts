// src/utils/StringUtils.ts

/**
 * Converts a snake_case or underscored string to a readable label.
 * Example: "passport_expiry" → "Passport Expiry"
 * @param str - The input string (can be null or undefined)
 * @returns A human-readable string
 */
export function toReadableLabel(str?: string | null): string {
  if (!str) return "—";

  return str
    .replace(/_/g, " ") // replace underscores with spaces
    .split(" ")
    .map((word) => {
      if (!word) return "";
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ")
    .trim();
}
