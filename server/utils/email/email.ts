import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { logErrorWithContext } from "../core/logger";
import { emailTemplates, type TemplateType } from "./email-templates";

// AWS SES email utility - internal functions only
// No routes needed - called by other services internally

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ca-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  template: TemplateType,
  data: any,
): Promise<{ success: boolean; messageId?: string }> => {
  // In development mode, override recipient to verified email for testing
  const actualRecipient =
    process.env.NODE_ENV === "development"
      ? process.env.SES_TEST_EMAIL || "aasplatform2@gmail.com"
      : to;

  try {
    // Get template or use provided subject
    const emailTemplate = emailTemplates[template];
    const emailContent = emailTemplate
      ? emailTemplate(data)
      : { subject, html: data.emailContent || "" };

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || "aasplatform2@gmail.com",
      Destination: {
        ToAddresses: [actualRecipient],
      },
      ReplyToAddresses: [process.env.AWS_SES_FROM_EMAIL || "aasplatform2@gmail.com"],
      Message: {
        Subject: {
          Data: emailContent.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: emailContent.html,
            Charset: "UTF-8",
          },
        },
      },
    });

    const result = await sesClient.send(command);

    console.log(
      `📧 [SES] Email sent successfully to ${actualRecipient} (intended: ${to}), MessageId: ${result.MessageId}`,
    );
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_email",
      to,
      subject,
      template,
    });
    console.error(`❌ [SES] Failed to send email to ${to}:`, error);
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
