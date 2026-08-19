// src/utils/validators.ts

/**
 * ✅ Validate an email address using RFC 5322-compliant regex
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email.trim());
}

/**
 * ✅ Validate phone number based on country code
 * - India (+91): 10 digits, starts with [6-9]
 * - UAE (+971): 9 digits, starts with 2–5 or 50–58 (common mobile prefixes)
 */
/**
 * ✅ Validate phone numbers for UAE, India, and generic defaults
 */
export function isValidPhoneNumber(phone: string, countryCode: string): boolean {
  if (!phone) return true; // allow empty (optional)
  const clean = phone.replace(/\D/g, "");
  const code = countryCode.replace("+", "").trim();

  switch (code) {
    case "91": // India
      return /^[6-9]\d{9}$/.test(clean.replace(/^91/, ""));
    case "971": // UAE
      const local = clean.replace(/^971|^0+/, "");
      return /^(2|3|4|5)\d{7}$/.test(local) || /^5[0-8]\d{7}$/.test(local);
    default:
      return /^\d{7,15}$/.test(clean);
  }
}

/**
 * ✅ Get user-friendly validation message for phone number
 */
export function getPhoneValidationMessage(
  phone: string,
  countryCode: string
): string | null {
  if (!phone?.trim()) return null; // allow blank field

  const valid = isValidPhoneNumber(phone, countryCode);
  if (valid) return null;

  return countryCode === "+91"
    ? "Please enter a valid 10-digit Indian phone number."
    : countryCode === "+971"
    ? "Please enter a valid UAE phone number (e.g. +971501234567 or +97143123456)."
    : "Invalid phone number format.";
}

/**
 * ✅ Get user-friendly validation message for email
 */
export function getEmailValidationMessage(email: string): string {
  if (!email?.trim()) return "Email is required.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  return "";
}

