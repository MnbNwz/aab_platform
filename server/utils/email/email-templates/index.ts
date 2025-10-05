import { otpVerificationTemplate } from "./otp-verification";
import { passwordResetTemplate } from "./password-reset";
import { paymentReceiptTemplate } from "./payment-receipt";
import { bidNotificationTemplate } from "./bid-notification";
import { paymentFailedTemplate } from "./payment-failed";

// Re-export individual templates
export { otpVerificationTemplate } from "./otp-verification";
export { passwordResetTemplate } from "./password-reset";
export { paymentReceiptTemplate } from "./payment-receipt";
export { bidNotificationTemplate } from "./bid-notification";
export { paymentFailedTemplate } from "./payment-failed";
export { emailColors } from "./colors";

// Template registry for easy access
export const emailTemplates = {
  otp_verification: otpVerificationTemplate,
  password_reset: passwordResetTemplate,
  payment_receipt: paymentReceiptTemplate,
  bid_notification: bidNotificationTemplate,
  payment_failed: paymentFailedTemplate,
} as const;

export type TemplateType = keyof typeof emailTemplates;
