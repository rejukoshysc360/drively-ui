// src/utils/DateUtils.ts

/**
 * Returns the previous month in YYYY-MM format.
 * Example: if today is 2025-11-07 → returns "2025-10"
 */
export function getPreviousMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns the current month (YYYY-MM)
 */
export function getCurrentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatDisplayDate(val: any): string {
  if (!val) return "—";

  const d = new Date(val);

  if (isNaN(d.getTime())) return String(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Parses a YYYY-MM-DD string into a proper Date object using LOCAL time
 * This avoids timezone offset bugs that break date comparisons (e.g. 14th becomes 13th)
 *
 * @param dateStr - string in format "2025-11-14"
 * @returns Date object set to that exact day (midnight local time)
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date;
};

/**
 * Normalizes any date-like value (ISO string, Date object, or plain string)
 * into a clean "YYYY-MM-DD" format for consistent display.
 *
 * Examples:
 *   formatDate("2025-12-30T00:00:00.000Z") → "2025-12-30"
 *   formatDate("2025-12-30") → "2025-12-30"
 *   formatDate(new Date("2025-12-30")) → "2025-12-30"
 *   formatDate(null) → "N/A"
 */
export function formatDate(val: any): string {
  if (!val) return "N/A";

  // Already a plain YYYY-MM-DD string
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }

  // Try to parse ISO or Date object
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return String(val);
}

export function isDateLike(value: any): boolean {
  if (typeof value !== "string") return false;

  return (
    value.includes("T") || // ISO datetime
    /^\d{4}-\d{2}-\d{2}$/.test(value) || // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/.test(value) || // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/.test(value) // DD-MM-YYYY
  );
}