// Email utility types
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
  | "welcome"
  | "payment_receipt"
  | "bid_notification";

// AWS SES types
export interface SESEmailParams {
  to: string;
  subject: string;
  template: TemplateType;
  data: EmailTemplateData;
}
