/**
 * Utility helpers for normalizing and displaying Egyptian and international WhatsApp & phone numbers.
 */

/**
 * Normalizes any Egyptian or international phone/WhatsApp number to E.164 standard format (+201025571092).
 * Correctly converts:
 * - "01025571092" -> "+201025571092"
 * - "011XXXXXXXX" -> "+2011XXXXXXXX"
 * - "012XXXXXXXX" -> "+2012XXXXXXXX"
 * - "015XXXXXXXX" -> "+2015XXXXXXXX"
 * - "1025571092"  -> "+201025571092"
 * - "+201025571092" -> "+201025571092"
 * - "201025571092"  -> "+201025571092"
 */
export function normalizeWhatsAppNumber(input: string): string {
  if (!input || typeof input !== "string") return "+201203441866";

  let cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  if (!cleaned) return "+201203441866";

  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.substring(2);
  }

  const hasPlus = cleaned.startsWith("+");
  let digits = cleaned.replace(/[^0-9]/g, "");
  if (!digits) return "+201203441866";

  // Egyptian mobile format: 010..., 011..., 012..., 015... (11 digits)
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "20" + digits.substring(1);
  }
  // Egyptian mobile format without leading 0: 10..., 11..., 12..., 15... (10 digits)
  else if (digits.startsWith("1") && digits.length === 10) {
    digits = "20" + digits;
  }
  // Single leading 0 not followed by 1
  else if (digits.startsWith("0") && !digits.startsWith("00")) {
    digits = "20" + digits.substring(1);
  }
  // Fallback for 10/11 digit inputs without + or country code 20
  else if (!hasPlus && !digits.startsWith("20") && (digits.length === 10 || digits.length === 11)) {
    if (digits.startsWith("0")) {
      digits = "20" + digits.substring(1);
    } else {
      digits = "20" + digits;
    }
  }

  return "+" + digits;
}

/**
 * Formats a stored WhatsApp number for local user-friendly display in admin inputs (e.g. 01025571092).
 */
export function displayWhatsAppNumber(input: string): string {
  if (!input || typeof input !== "string") return "";

  const cleaned = input.trim().replace(/[\s\-\(\)]/g, "");
  const digits = cleaned.replace(/[^0-9]/g, "");

  // Egyptian mobile: 201XXXXXXXXX (12 digits) -> 01XXXXXXXXX (11 digits)
  if (digits.startsWith("201") && digits.length === 12) {
    return "0" + digits.substring(2);
  }

  // Already 01XXXXXXXXX (11 digits)
  if (digits.startsWith("01") && digits.length === 11) {
    return digits;
  }

  return cleaned.startsWith("+") ? cleaned : (cleaned.startsWith("0") ? cleaned : "+" + cleaned);
}

/**
 * Returns a clean digits string suitable for wa.me URLs (e.g. 201025571092).
 */
export function getWhatsAppUrlDigits(input: string): string {
  const normalized = normalizeWhatsAppNumber(input);
  return normalized.replace(/[^0-9]/g, "");
}
