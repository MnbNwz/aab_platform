import nodemailer from "nodemailer";
import { logErrorWithContext } from "../core/logger";
import { emailTemplates, type TemplateType } from "./email-templates";

// SMTP email utility - internal functions only
// No routes needed - called by other services internally

// Initialize SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
};

export const sendEmail = async (
  to: string,
  subject: string,
  template: TemplateType,
  data: any,
): Promise<{ success: boolean; messageId?: string }> => {
  // In development mode, override recipient to test email for testing
  const actualRecipient =
    process.env.NODE_ENV === "development" ? process.env.SMTP_TEST_EMAIL || to : to;

  try {
    const transporter = createTransporter();

    // Get template or use provided subject
    const emailTemplate = emailTemplates[template];
    const emailContent = emailTemplate
      ? emailTemplate(data)
      : { subject, html: data.emailContent || "" };

    const mailOptions = {
      from: {
        name: process.env.SMTP_FROM_NAME || "AAS Platform",
        address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      },
      to: actualRecipient,
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
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
      `📧 [SMTP] Email sent successfully to ${actualRecipient} (intended: ${to}), MessageId: ${result.messageId}`,
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_email",
      to,
      subject,
      template,
    });
    console.error(`❌ [SMTP] Failed to send email to ${to}:`, error);
    return { success: false };
  }
};

// Internal notification functions - called by other services
export const sendPaymentReceipt = async (
  userEmail: string,
  paymentType: "membership" | "job" | "offmarket",
  amount: number,
  paymentId: string,
  additionalData?: any,
): Promise<{ success: boolean }> => {
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

    console.log(
      `💰 [PAYMENT RECEIPT] Sent to ${userEmail}, Type: ${paymentType}, Amount: $${amount / 100}`,
    );
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_payment_receipt",
      userEmail,
      paymentType,
    });
    return { success: false };
  }
};

export const sendBidAcceptedNotification = async (
  contractorEmail: string,
  customerName: string,
  jobTitle: string,
  bidAmount: number,
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(contractorEmail, "", "bid_notification", {
      contractorName: customerName,
      jobTitle,
      bidAmount,
      jobId: "job-id-placeholder",
      viewBidUrl: `${process.env.FRONTEND_URL}/contractor/bids`,
    });

    console.log(`🔨 [BID ACCEPTED] Notification sent to ${contractorEmail}`);
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_bid_accepted_notification",
      contractorEmail,
    });
    return { success: false };
  }
};

export const sendWelcomeEmail = async (
  userEmail: string,
  firstName: string,
  role: "customer" | "contractor",
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(userEmail, "", "welcome", {
      firstName,
      role,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    });

    console.log(`🎉 [WELCOME] Email sent to ${userEmail} (${role})`);
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_welcome_email",
      userEmail,
      role,
    });
    return { success: false };
  }
};
