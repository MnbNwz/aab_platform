// Validation utility types
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  score?: number;
  feedback?: string[];
}

export interface PhoneValidationResult extends ValidationResult {
  formattedNumber?: string;
  countryCode?: string;
}

export interface FileValidationResult extends ValidationResult {
  fileSize?: number;
  fileType?: string;
  fileName?: string;
}

// OTP utility types
export interface OTPData {
  code: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
}

export interface OTPValidationResult extends ValidationResult {
  attemptsRemaining?: number;
  canResendAt?: Date;
}
