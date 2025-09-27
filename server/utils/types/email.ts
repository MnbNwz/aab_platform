// Email-related types and interfaces

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryAfter?: number;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls: {
    rejectUnauthorized: boolean;
  };
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  pool: boolean;
  maxConnections: number;
  maxMessages: number;
  rateDelta: number;
  rateLimit: number;
}

export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  (data: EmailTemplateData): string;
}

export type TemplateType =
  | "otp_verification"
  | "password_reset"
  | "payment_receipt"
  | "welcome"
  | "bid_notification";

export interface EmailStats {
  attemptsToday: number;
  lastSent: Date | null;
  isBlocked: boolean;
  blockUntil: Date | null;
}

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
}

export interface DebounceResult {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
}
