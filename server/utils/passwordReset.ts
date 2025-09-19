import crypto from "crypto";

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
 * Generate password reset email content
 */
export function generatePasswordResetEmailContent(resetToken: string, firstName: string): string {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .reset-button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #dc3545; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>You requested a password reset for your AAS Platform account.</p>
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 AAS Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
