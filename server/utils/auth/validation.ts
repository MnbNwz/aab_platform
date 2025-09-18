import crypto from "crypto";
import {
  validateEmail as validateEmailLib,
  validatePhone as validatePhoneLib,
} from "@utils/validation";

/**
 * Validate email format using comprehensive validation
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  return validateEmailLib(email).isValid;
}

/**
 * Validate phone number format using comprehensive validation
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 */
export function validatePhone(phone: string): boolean {
  return validatePhoneLib(phone).isValid;
}

/**
 * Sanitize user object by removing sensitive fields
 * @param user - User object
 * @returns Sanitized user object
 */
export function sanitizeUser(user: any): any {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  delete userObj.__v;
  return userObj;
}

/**
 * Generate random string for tokens or IDs
 * @param length - Length of random string
 * @returns Random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}
