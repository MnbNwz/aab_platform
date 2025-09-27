import * as nodemailer from "nodemailer";
import { logErrorWithContext } from "@utils/core/logger";
import { emailTemplates, type TemplateType } from "@utils/email/email-templates";
import type { EmailResult, SMTPConfig } from "@utils/types/email";
import { validateEmail } from "@utils/validation/validation";
import { VALIDATION_CONSTANTS } from "@utils/constants/validation";

// Destructure environment variables once for better performance
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
  SMTP_TLS_REJECT_UNAUTHORIZED,
  SMTP_CONNECTION_TIMEOUT,
  SMTP_GREETING_TIMEOUT,
  SMTP_SOCKET_TIMEOUT,
  SMTP_POOL,
  SMTP_MAX_CONNECTIONS,
  SMTP_MAX_MESSAGES,
  SMTP_RATE_DELTA,
  SMTP_RATE_LIMIT,
  SMTP_MAX_RETRIES,
  SMTP_RETRY_DELAY,
  FRONTEND_URL,
} = process.env;

// Initialize SMTP transporter with enhanced configuration
const createTransporter = (): nodemailer.Transporter => {
  const smtpConfig: SMTPConfig = {
    host: SMTP_HOST!,
    port: parseInt(SMTP_PORT || "465"),
    secure: SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: SMTP_USER!,
      pass: SMTP_PASS!,
    },
    tls: {
      rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
    // Enhanced connection settings for better reliability
    connectionTimeout: parseInt(SMTP_CONNECTION_TIMEOUT || "60000"), // 60 seconds
    greetingTimeout: parseInt(SMTP_GREETING_TIMEOUT || "30000"), // 30 seconds
    socketTimeout: parseInt(SMTP_SOCKET_TIMEOUT || "60000"), // 60 seconds
    // Retry configuration
    pool: SMTP_POOL === "true",
    maxConnections: parseInt(SMTP_MAX_CONNECTIONS || "5"),
    maxMessages: parseInt(SMTP_MAX_MESSAGES || "100"),
    rateDelta: parseInt(SMTP_RATE_DELTA || "1000"),
    rateLimit: parseInt(SMTP_RATE_LIMIT || "5"),
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

// Rate limiting and debouncing removed to reduce server burden

// Enhanced email sending with comprehensive validation
export const sendEmail = async (
  to: string,
  subject: string,
  template: TemplateType,
  data: Record<string, any>,
  retryCount: number = 0,
): Promise<EmailResult> => {
  const maxRetries = parseInt(SMTP_MAX_RETRIES || "3");
  const retryDelay = parseInt(SMTP_RETRY_DELAY || "2000");

  try {
    // 1. Email validation
    const emailValidation = validateEmailAddress(to);
    if (!emailValidation.isValid) {
      return { success: false, error: `Invalid email address: ${emailValidation.error}` };
    }

    // 2. Rate limiting and debouncing removed to reduce server burden

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

    // Verify SMTP connection before sending
    await transporter.verify();

    // Get template content
    const emailTemplate = emailTemplates[template];
    const emailContent = emailTemplate(data as any);

    const mailOptions = {
      from: {
        name: SMTP_FROM_NAME,
        address: SMTP_FROM_EMAIL || SMTP_USER,
      },
      to: to,
      replyTo: process.env.SMTP_REPLY_TO || SMTP_FROM_EMAIL || SMTP_USER,
      subject: emailContent.subject,
      html: emailContent.html,
      // Add DKIM signing if configured
      dkim: process.env.SMTP_DKIM_PRIVATE_KEY
        ? {
            domainName: process.env.SMTP_DKIM_DOMAIN,
            keySelector: process.env.SMTP_DKIM_KEY_SELECTOR,
            privateKey: process.env.SMTP_DKIM_PRIVATE_KEY,
          }
        : undefined,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(
      `📧 [SMTP] Email sent successfully to ${to}, MessageId: ${result.messageId}, Template: ${template}`,
    );

    return { success: true, messageId: result.messageId };
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
      verificationUrl: `${FRONTEND_URL}/verify-email`,
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
      viewBidUrl: `${FRONTEND_URL}/contractor/bids`,
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

export const sendWelcomeEmail = async (
  userEmail: string,
  firstName: string,
  role: "customer" | "contractor",
): Promise<EmailResult> => {
  try {
    const result = await sendEmail(userEmail, "", "welcome", {
      firstName,
      role,
      dashboardUrl: `${FRONTEND_URL}/dashboard`,
    });

    if (result.success) {
      console.log(`🎉 [WELCOME] Email sent to ${userEmail} (${role})`);
    } else {
      console.error(
        `❌ [WELCOME] Failed to send to ${userEmail} (${role}), Error: ${result.error}`,
      );
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logErrorWithContext(error as Error, {
      operation: "send_welcome_email",
      userEmail,
      role,
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
      resetUrl: `${FRONTEND_URL}/reset-password?token=${resetToken}`,
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

// Email statistics and admin functions removed to reduce server burden
// Use database or Redis for production statistics if needed
