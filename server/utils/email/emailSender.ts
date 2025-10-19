import * as nodemailer from "nodemailer";
import { logErrorWithContext } from "@utils/core/logger";
import { emailTemplates, type TemplateType } from "@utils/email/email-templates";
import type { EmailResult, SMTPConfig } from "@utils/types/email";
import { validateEmail } from "@utils/validation/validation";
import { VALIDATION_CONSTANTS } from "@utils/constants/validation";
import { ENV_CONFIG } from "@config/env";

// Destructure environment variables once for better performance

// Initialize SMTP transporter with enhanced configuration
const createTransporter = (): nodemailer.Transporter => {
  const smtpConfig: SMTPConfig = {
    host: ENV_CONFIG.SMTP.HOST,
    port: ENV_CONFIG.SMTP.PORT,
    secure: ENV_CONFIG.SMTP.SECURE,
    auth: {
      user: ENV_CONFIG.SMTP.USER,
      pass: ENV_CONFIG.SMTP.PASS,
    },
    tls: {
      rejectUnauthorized: ENV_CONFIG.SMTP.TLS_REJECT_UNAUTHORIZED,
    },
    // Enhanced connection settings for better reliability
    connectionTimeout: ENV_CONFIG.SMTP.CONNECTION_TIMEOUT,
    greetingTimeout: ENV_CONFIG.SMTP.GREETING_TIMEOUT,
    socketTimeout: ENV_CONFIG.SMTP.SOCKET_TIMEOUT,
    // Retry configuration
    pool: ENV_CONFIG.SMTP.POOL,
    maxConnections: ENV_CONFIG.SMTP.MAX_CONNECTIONS,
    maxMessages: ENV_CONFIG.SMTP.MAX_MESSAGES,
    rateDelta: ENV_CONFIG.SMTP.RATE_DELTA,
    rateLimit: ENV_CONFIG.SMTP.RATE_LIMIT,
  };

  return nodemailer.createTransport(smtpConfig);
};

// Email validation with comprehensive checks
const validateEmailAddress = (email: string): { isValid: boolean; error?: string } => {
  // Basic validation
  const validation = validateEmail(email);
  if (!validation.isValid) {
    return { isValid: false, error: validation.message };
  }

  // Additional security checks
  if (email.length > VALIDATION_CONSTANTS.EMAIL_MAX_LENGTH) {
    return { isValid: false, error: "Email address is too long" };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.{2,}/, // Multiple consecutive dots
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
    /@.*@/, // Multiple @ symbols
    /[<>]/, // HTML tags
  ];

  // Check for control characters separately
  const hasControlChars = email.split("").some((char) => {
    const code = char.charCodeAt(0);
    return (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return { isValid: false, error: "Email contains invalid characters" };
    }
  }

  if (hasControlChars) {
    return { isValid: false, error: "Email contains invalid characters" };
  }

  return { isValid: true };
};

// Enhanced email sending with comprehensive validation
export const sendEmail = async (
  to: string,
  subject: string,
  template: TemplateType,
  data: Record<string, any>,
  retryCount: number = 0,
): Promise<EmailResult> => {
  const maxRetries = ENV_CONFIG.SMTP.MAX_RETRIES;
  const retryDelay = ENV_CONFIG.SMTP.RETRY_DELAY;

  try {
    // 1. Email validation
    const emailValidation = validateEmailAddress(to);
    if (!emailValidation.isValid) {
      return { success: false, error: `Invalid email address: ${emailValidation.error}` };
    }

    // 3. Template validation
    if (!emailTemplates[template]) {
      return { success: false, error: `Invalid email template: ${template}` };
    }

    // 4. Data validation
    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid email data" };
    }

    // 5. SMTP connection and sending
    const transporter = createTransporter();

    // Skip SMTP verification for faster response (fire and forget)
    // await transporter.verify();

    // Get template content
    const emailTemplate = emailTemplates[template];
    const emailContent = emailTemplate(data as any);

    const mailOptions = {
      from: {
        name: ENV_CONFIG.SMTP.FROM_NAME,
        address: ENV_CONFIG.SMTP.FROM_EMAIL,
      },
      to: to,
      replyTo: ENV_CONFIG.SMTP.REPLY_TO,
      subject: emailContent.subject,
      html: emailContent.html,
      // Add DKIM signing if configured
      dkim: ENV_CONFIG.SMTP.DKIM.PRIVATE_KEY
        ? {
            domainName: ENV_CONFIG.SMTP.DKIM.DOMAIN!,
            keySelector: ENV_CONFIG.SMTP.DKIM.KEY_SELECTOR!,
            privateKey: ENV_CONFIG.SMTP.DKIM.PRIVATE_KEY,
          }
        : undefined,
    };

    // Send email without waiting for completion (fire and forget)
    transporter
      .sendMail(mailOptions)
      .then((result) => {
        console.log(
          `📧 [SMTP] Email sent successfully to ${to}, MessageId: ${result.messageId}, Template: ${template}`,
        );
      })
      .catch((error) => {
        console.error(`❌ [SMTP] Failed to send email to ${to}:`, error);
        logErrorWithContext(error as Error, {
          operation: "send_email_async",
          to,
          subject,
          template,
        });
      });

    // Return immediately without waiting
    return { success: true, messageId: "pending" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logErrorWithContext(error as Error, {
      operation: "send_email",
      to,
      subject,
      template,
      retryCount,
    });

    // Retry logic for transient errors
    if (retryCount < maxRetries && isRetryableError(error)) {
      console.log(
        `🔄 [SMTP] Retrying email to ${to} (attempt ${retryCount + 1}/${maxRetries}) after ${retryDelay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return sendEmail(to, subject, template, data, retryCount + 1);
    }

    console.error(
      `❌ [SMTP] Failed to send email to ${to} after ${retryCount + 1} attempts:`,
      error,
    );
    return { success: false, error: errorMessage };
  }
};

// Helper function to determine if an error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const errorObj = error as Record<string, any>;
  const errorMessage = errorObj.message?.toLowerCase() || "";
  const errorCode = errorObj.code?.toLowerCase() || "";

  // Retryable error conditions
  const retryableConditions = [
    "timeout",
    "connection",
    "network",
    "econnreset",
    "enotfound",
    "econnrefused",
    "temporary",
    "rate limit",
    "too many",
    "busy",
    "unavailable",
    "service unavailable",
    "internal server error",
  ];

  return retryableConditions.some(
    (condition) => errorMessage.includes(condition) || errorCode.includes(condition),
  );
};

// Email verification status check
export const isEmailVerified = (userVerification: any): boolean => {
  if (!userVerification) return false;

  // Check if email is verified through OTP
  if (userVerification.emailVerified) return true;

  // Check if email is verified through other methods
  if (userVerification.verificationMethod === "otp" && userVerification.otpVerified) return true;

  return false;
};

// Enhanced OTP email sending with verification check
export const sendOTPEmail = async (
  userEmail: string,
  otpCode: string,
  firstName: string,
  userVerification?: any,
): Promise<EmailResult> => {
  try {
    // Check if email is already verified (skip OTP if verified)
    if (userVerification && isEmailVerified(userVerification)) {
      console.log(`📧 [OTP] Skipping OTP email to ${userEmail} - email already verified`);
      return { success: true, messageId: "skipped_verified" };
    }

    const result = await sendEmail(userEmail, "", "otp_verification", {
      otpCode,
      firstName,
      verificationUrl: `${ENV_CONFIG.FRONTEND_URL}/verify-email`,
    });

    if (result.success) {
      console.log(`🔐 [OTP] Verification email sent to ${userEmail}`);
    } else {
      console.error(
        `❌ [OTP] Failed to send verification email to ${userEmail}, Error: ${result.error}`,
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_otp_email",
      userEmail,
    });
    return { success: false, error: errorMessage };
  }
};

// Internal notification functions - called by other services
export const sendPaymentReceipt = async (
  userEmail: string,
  paymentType: "membership" | "job" | "offmarket",
  amount: number,
  paymentId: string,
  additionalData?: Record<string, any>,
): Promise<EmailResult> => {
  try {
    const result = await sendEmail(userEmail, "", "payment_receipt", {
      firstName: additionalData?.firstName || "Customer",
      amount,
      paymentId,
      paymentType,
      planName: additionalData?.planName,
      jobTitle: additionalData?.jobTitle,
      date: new Date().toLocaleDateString(),
      ...additionalData,
    });

    if (result.success) {
      console.log(
        `💰 [PAYMENT RECEIPT] Sent to ${userEmail}, Type: ${paymentType}, Amount: $${amount / 100}`,
      );
    } else {
      console.error(
        `❌ [PAYMENT RECEIPT] Failed to send to ${userEmail}, Type: ${paymentType}, Error: ${result.error}`,
      );
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_payment_receipt",
      userEmail,
      paymentType,
    });
    return { success: false, error: errorMessage };
  }
};

export const sendBidAcceptedNotification = async (
  contractorEmail: string,
  customerName: string,
  jobTitle: string,
  bidAmount: number,
): Promise<EmailResult> => {
  try {
    const result = await sendEmail(contractorEmail, "", "bid_notification", {
      contractorName: customerName,
      jobTitle,
      bidAmount,
      jobId: "job-id-placeholder",
      viewBidUrl: `${ENV_CONFIG.FRONTEND_URL}/contractor/bids`,
    });

    if (result.success) {
      console.log(`🔨 [BID ACCEPTED] Notification sent to ${contractorEmail}`);
    } else {
      console.error(
        `❌ [BID ACCEPTED] Failed to send to ${contractorEmail}, Error: ${result.error}`,
      );
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_bid_accepted_notification",
      contractorEmail,
    });
    return { success: false, error: errorMessage };
  }
};

// Password reset email with enhanced security
export const sendPasswordResetEmail = async (
  userEmail: string,
  resetToken: string,
  firstName: string,
): Promise<EmailResult> => {
  try {
    const result = await sendEmail(userEmail, "", "password_reset", {
      firstName,
      resetUrl: `${ENV_CONFIG.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiryHours: 1, // Password reset expires in 1 hour
    });

    if (result.success) {
      console.log(`🔑 [PASSWORD RESET] Email sent to ${userEmail}`);
    } else {
      console.error(`❌ [PASSWORD RESET] Failed to send to ${userEmail}, Error: ${result.error}`);
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_password_reset_email",
      userEmail,
    });
    return { success: false, error: errorMessage };
  }
};

// Payment failure notification
export const sendPaymentFailedNotification = async (
  userEmail: string,
  amount: number,
  failureReason: string,
  planName?: string,
  retryUrl?: string,
): Promise<EmailResult> => {
  try {
    const result = await sendEmail(userEmail, "", "payment_failed", {
      firstName: "Customer", // Will be replaced with actual user data when called
      amount,
      failureReason,
      planName,
      retryUrl: retryUrl || `${ENV_CONFIG.FRONTEND_URL}/update-payment`,
    });

    if (result.success) {
      console.log(
        `💳 [PAYMENT FAILED] Notification sent to ${userEmail}, Amount: $${amount / 100}`,
      );
    } else {
      console.error(
        `❌ [PAYMENT FAILED] Failed to send to ${userEmail}, Amount: $${amount / 100}, Error: ${result.error}`,
      );
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_payment_failed_notification",
      userEmail,
      amount,
      failureReason,
    });
    return { success: false, error: errorMessage };
  }
};
