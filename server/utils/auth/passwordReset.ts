import crypto from "crypto";
import { ENV_CONFIG } from "@config/env";

/**
 * Generate a secure password reset token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-character hex string
}

/**
 * Generate password reset expiration time (1 hour from now)
 */
export function generatePasswordResetExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
}

/**
 * Check if password reset token is expired
 */
export function isPasswordResetExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Check if enough time has passed since last password reset request (rate limiting)
 */
export function canRequestPasswordReset(
  lastRequestedAt: Date | null,
  cooldownMinutes: number = 5,
): boolean {
  if (!lastRequestedAt) return true; // First time requesting

  const now = new Date();
  const timeDiff = now.getTime() - lastRequestedAt.getTime();
  const minutesDiff = timeDiff / (1000 * 60); // Convert to minutes

  return minutesDiff >= cooldownMinutes;
}

/**
 * Get remaining cooldown time for password reset in seconds
 */
export function getPasswordResetCooldownTime(
  lastRequestedAt: Date | null,
  cooldownMinutes: number = 5,
): number {
  if (!lastRequestedAt) return 0;

  const now = new Date();
  const timeDiff = now.getTime() - lastRequestedAt.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  const remainingMinutes = cooldownMinutes - minutesDiff;

  return Math.max(0, Math.ceil(remainingMinutes * 60)); // Return seconds
}

/**
 * Create password reset object
 */
export function createPasswordResetData() {
  const token = generatePasswordResetToken();
  const expiresAt = generatePasswordResetExpiry();
  const lastRequestedAt = new Date();

  return {
    token,
    expiresAt,
    lastRequestedAt,
  };
}

/**
 * Clear password reset data after successful reset
 */
export function clearPasswordResetData() {
  return {
    token: null,
    expiresAt: null,
    lastRequestedAt: null,
  };
}

/**
 * Generate password reset URL for email templates
 */
export function generatePasswordResetUrl(resetToken: string): string {
  return `${ENV_CONFIG.FRONTEND_URL}/reset-password?token=${resetToken}`;
}
