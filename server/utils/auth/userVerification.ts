import { generateOTP, generateOTPExpiry, isOTPExpired } from "./otp";

/**
 * Create initial userVerification object for new users
 */
export function createInitialVerification() {
  const otpCode = generateOTP();
  const otpExpiresAt = generateOTPExpiry();
  const lastSentAt = new Date();

  return {
    isVerified: false,
    otpCode,
    otpExpiresAt,
    lastSentAt,
    canResend: true,
    cooldownSeconds: 0,
  };
}

/**
 * Update userVerification object for resend
 */
export function updateVerificationForResend(currentVerification: any, cooldownMinutes: number = 1) {
  const now = new Date();
  const lastSent = currentVerification.lastSentAt;

  // If no lastSentAt, allow resend immediately
  if (!lastSent) {
    const otpCode = generateOTP();
    const otpExpiresAt = generateOTPExpiry();
    const lastSentAt = new Date();

    return {
      isVerified: false,
      otpCode,
      otpExpiresAt,
      lastSentAt,
      canResend: true,
      cooldownSeconds: 0,
    };
  }

  // Check if enough time has passed
  const timeDiff = now.getTime() - lastSent.getTime();
  const minutesDiff = timeDiff / (1000 * 60);

  if (minutesDiff < cooldownMinutes) {
    // Still in cooldown
    const remainingSeconds = Math.ceil((cooldownMinutes - minutesDiff) * 60);
    return {
      ...currentVerification,
      canResend: false,
      cooldownSeconds: remainingSeconds,
    };
  }

  // Can resend - generate new OTP (reset all data first)
  const otpCode = generateOTP();
  const otpExpiresAt = generateOTPExpiry();
  const lastSentAt = new Date();

  return {
    isVerified: false,
    otpCode,
    otpExpiresAt,
    lastSentAt,
    canResend: true,
    cooldownSeconds: 0,
  };
}

/**
 * Verify OTP and update verification object
 */
export function verifyOTPAndUpdate(
  currentVerification: any,
  providedOTP: string,
): { success: boolean; updatedVerification: any } {
  // Check if already verified
  if (currentVerification.isVerified) {
    return {
      success: false,
      updatedVerification: currentVerification,
    };
  }

  // Check if OTP exists and not expired
  if (!currentVerification.otpCode || !currentVerification.otpExpiresAt) {
    return {
      success: false,
      updatedVerification: currentVerification,
    };
  }

  if (isOTPExpired(currentVerification.otpExpiresAt)) {
    return {
      success: false,
      updatedVerification: currentVerification,
    };
  }

  // Check OTP match
  if (currentVerification.otpCode !== providedOTP) {
    return {
      success: false,
      updatedVerification: currentVerification,
    };
  }

  // Success - clear ALL OTP properties and mark as verified
  return {
    success: true,
    updatedVerification: {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
      lastSentAt: null, // Clear lastSentAt too
      canResend: false,
      cooldownSeconds: 0,
    },
  };
}

/**
 * Reset OTP data for resend (clears all OTP properties)
 */
export function resetOTPData() {
  return {
    isVerified: false,
    otpCode: null,
    otpExpiresAt: null,
    lastSentAt: null,
    canResend: true,
    cooldownSeconds: 0,
  };
}

/**
 * Get verification status for frontend
 */
export function getVerificationStatus(verification: any) {
  if (verification.isVerified) {
    // User is verified - return minimal info, no OTP data
    return {
      isVerified: true,
      message: "Email verified successfully!",
      otpCode: null,
      canResend: false,
      cooldownSeconds: 0,
      otpSentAt: null,
      otpExpiresAt: null,
    };
  }

  if (!verification.otpCode || !verification.otpExpiresAt) {
    return {
      isVerified: false,
      message: "No verification code found. Please request a new one.",
      otpCode: null,
      canResend: true,
      cooldownSeconds: 0,
      otpSentAt: null,
      otpExpiresAt: null,
    };
  }

  if (isOTPExpired(verification.otpExpiresAt)) {
    return {
      isVerified: false,
      message: "Verification code has expired. Please request a new one.",
      otpCode: null,
      canResend: true,
      cooldownSeconds: 0,
      otpSentAt: verification.lastSentAt,
      otpExpiresAt: verification.otpExpiresAt,
    };
  }

  // Check cooldown
  if (!verification.canResend && verification.cooldownSeconds > 0) {
    // Calculate OTP expiry time if OTP exists
    const otpExpiresIn = verification.otpExpiresAt
      ? Math.max(0, Math.floor((verification.otpExpiresAt.getTime() - new Date().getTime()) / 1000))
      : 0;

    return {
      isVerified: false,
      message: `Please wait ${verification.cooldownSeconds} seconds before requesting a new code.`,
      otpCode: null, // NEVER send OTP in response
      canResend: false,
      cooldownSeconds: verification.cooldownSeconds,
      otpExpiresInSeconds: otpExpiresIn,
      otpSentAt: verification.lastSentAt,
      otpExpiresAt: verification.otpExpiresAt,
    };
  }

  // Valid OTP available - calculate remaining time
  const otpExpiresIn = Math.max(
    0,
    Math.floor((verification.otpExpiresAt.getTime() - new Date().getTime()) / 1000),
  );
  return {
    isVerified: false,
    message: `Verification code sent to your email. It expires in ${Math.ceil(otpExpiresIn / 60)} minutes.`,
    otpCode: null, // NEVER send OTP in response
    canResend: true,
    cooldownSeconds: 0,
    otpExpiresInSeconds: otpExpiresIn, // Remaining time in seconds
    otpSentAt: verification.lastSentAt,
    otpExpiresAt: verification.otpExpiresAt,
  };
}
