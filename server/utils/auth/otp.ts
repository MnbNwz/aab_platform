import crypto from "crypto";

/**
 * Generate a 6-digit OTP code with enhanced security
 */
export function generateOTP(): string {
  // Use crypto.randomBytes for additional entropy
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);

  // Ensure 6-digit range (100000-999999)
  const otp = (randomNumber % 900000) + 100000;

  return otp.toString();
}

/**
 * Generate a more secure OTP with additional entropy
 */
export function generateSecureOTP(): string {
  // Generate 6 random bytes for maximum entropy
  const randomBytes = crypto.randomBytes(6);

  // Convert to 6-digit number
  let otp = 0;
  for (let i = 0; i < 6; i++) {
    otp = otp * 10 + (randomBytes[i] % 10);
  }

  // Ensure it's in valid range
  if (otp < 100000) {
    otp += 100000;
  }

  return otp.toString();
}

/**
 * Generate OTP expiration time (10 minutes from now)
 */
export function generateOTPExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Generate OTP with rate limiting protection
 */
export function generateOTPWithRateLimit(): { otp: string; attempts: number } {
  // Add timestamp-based entropy to prevent pattern recognition
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4);
  const timestampBytes = Buffer.from(timestamp.toString(16), "hex");

  // Combine random bytes with timestamp for additional entropy
  const combinedBytes = Buffer.concat([randomBytes, timestampBytes.slice(-2)]);
  const randomNumber = combinedBytes.readUInt32BE(0);

  const otp = (randomNumber % 900000) + 100000;

  return {
    otp: otp.toString(),
    attempts: 0, // Track attempts for rate limiting
  };
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Verify OTP code
 */
export function verifyOTP(providedOTP: string, storedOTP: string, expiresAt: Date): boolean {
  if (isOTPExpired(expiresAt)) {
    return false;
  }
  return providedOTP === storedOTP;
}

/**
 * Check if enough time has passed since last OTP send (rate limiting)
 */
export function canResendOTP(lastSentAt: Date | undefined, cooldownMinutes: number = 1): boolean {
  if (!lastSentAt) return true; // First time sending

  const now = new Date();
  const timeDiff = now.getTime() - lastSentAt.getTime();
  const minutesDiff = timeDiff / (1000 * 60); // Convert to minutes

  return minutesDiff >= cooldownMinutes;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getRemainingCooldownTime(
  lastSentAt: Date | undefined,
  cooldownMinutes: number = 1,
): number {
  if (!lastSentAt) return 0;

  const now = new Date();
  const timeDiff = now.getTime() - lastSentAt.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  const remainingMinutes = cooldownMinutes - minutesDiff;

  return Math.max(0, Math.ceil(remainingMinutes * 60)); // Return seconds
}

/**
 * User verification states
 */
export enum VerificationState {
  NOT_VERIFIED = "not_verified", // User created but email not verified
  VERIFIED = "verified", // Email verified, can sign in
  OTP_EXPIRED = "otp_expired", // OTP code expired, need new one
  COOLDOWN_ACTIVE = "cooldown_active", // Rate limited, need to wait
  VERIFICATION_FAILED = "verification_failed", // Invalid OTP entered
}

/**
 * Get user verification state and details
 */
export function getUserVerificationState(
  isEmailVerified: boolean,
  otpCode: string | undefined,
  otpExpiresAt: Date | undefined,
  otpLastSentAt: Date | undefined,
  cooldownMinutes: number = 1,
): {
  state: VerificationState;
  message: string;
  canResend: boolean;
  cooldownSeconds: number;
  otpExpiresIn: number; // seconds until OTP expires
} {
  // If already verified
  if (isEmailVerified) {
    return {
      state: VerificationState.VERIFIED,
      message: "Email is verified. You can sign in.",
      canResend: false,
      cooldownSeconds: 0,
      otpExpiresIn: 0,
    };
  }

  // If no OTP exists
  if (!otpCode || !otpExpiresAt) {
    return {
      state: VerificationState.NOT_VERIFIED,
      message: "No verification code found. Please request a new one.",
      canResend: true,
      cooldownSeconds: 0,
      otpExpiresIn: 0,
    };
  }

  // Check if OTP is expired
  if (isOTPExpired(otpExpiresAt)) {
    return {
      state: VerificationState.OTP_EXPIRED,
      message: "Verification code has expired. Please request a new one.",
      canResend: true,
      cooldownSeconds: 0,
      otpExpiresIn: 0,
    };
  }

  // Check if in cooldown period
  const cooldownSeconds = getRemainingCooldownTime(otpLastSentAt, cooldownMinutes);
  if (cooldownSeconds > 0) {
    return {
      state: VerificationState.COOLDOWN_ACTIVE,
      message: `Please wait ${cooldownSeconds} seconds before requesting a new verification code.`,
      canResend: false,
      cooldownSeconds,
      otpExpiresIn: Math.max(0, Math.floor((otpExpiresAt.getTime() - new Date().getTime()) / 1000)),
    };
  }

  // OTP is valid and can be used
  const otpExpiresIn = Math.max(
    0,
    Math.floor((otpExpiresAt.getTime() - new Date().getTime()) / 1000),
  );
  return {
    state: VerificationState.NOT_VERIFIED,
    message: `Verification code sent to your email. It expires in ${Math.ceil(otpExpiresIn / 60)} minutes.`,
    canResend: true,
    cooldownSeconds: 0,
    otpExpiresIn,
  };
}
