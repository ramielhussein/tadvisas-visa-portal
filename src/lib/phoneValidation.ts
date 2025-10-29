/**
 * Phone validation utilities for UAE numbers (971XXXXXXXXX format)
 * Optimized for WhatsApp API integration
 */

import { z } from "zod";

/**
 * Validates UAE phone numbers in 971XXXXXXXXX format
 * - Must start with 971
 * - Followed by 9 digits (total 12 digits)
 * - No spaces, dashes, or special characters
 */
export const phoneSchema = z
  .string()
  .regex(/^971\d{9}$/, {
    message: "Phone must be in format 971XXXXXXXXX (e.g., 971501234567)",
  })
  .length(12, { message: "Phone must be exactly 12 digits starting with 971" });

/**
 * Format a phone number for display
 * Converts 971501234567 -> +971 50 123 4567
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone || phone.length !== 12) return phone;
  
  const countryCode = phone.slice(0, 3);
  const area = phone.slice(3, 5);
  const part1 = phone.slice(5, 8);
  const part2 = phone.slice(8, 12);
  
  return `+${countryCode} ${area} ${part1} ${part2}`;
};

/**
 * Sanitize phone input - remove all non-digit characters except leading +
 */
export const sanitizePhoneInput = (input: string): string => {
  // Remove all non-digits except +
  let cleaned = input.replace(/[^\d+]/g, "");
  
  // If starts with +971, convert to 971
  if (cleaned.startsWith("+971")) {
    cleaned = cleaned.slice(1);
  }
  // If starts with 00971, convert to 971
  else if (cleaned.startsWith("00971")) {
    cleaned = cleaned.slice(2);
  }
  // If starts with 0 (UAE local format), add 971
  else if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "971" + cleaned.slice(1);
  }
  
  return cleaned;
};

/**
 * Generate WhatsApp link from phone number
 */
export const generateWhatsAppLink = (phone: string, message?: string): string => {
  const sanitized = sanitizePhoneInput(phone);
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${sanitized}${encodedMessage}`;
};

/**
 * Validate phone number and return error message if invalid
 */
export const validatePhone = (phone: string): string | null => {
  try {
    phoneSchema.parse(phone);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0].message;
    }
    return "Invalid phone number";
  }
};
