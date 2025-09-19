import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { logErrorWithContext } from "@utils/logger";

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

// Email templates
const emailTemplates = {
  otp_verification: (data: any) => ({
    subject: "Verify Your Email - AAS Platform",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName || "User"}!</h2>
            <p>Thank you for signing up with AAS Platform. Please verify your email address using the code below:</p>
            <div class="otp-code">${data.otpCode}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 AAS Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  payment_receipt: (data: any) => ({
    subject: "Payment Receipt - AAS Platform",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Receipt</h1>
          </div>
          <div class="content">
            <h2>Payment Successful!</h2>
            <p>Your payment of <span class="amount">$${(data.amount / 100).toFixed(2)}</span> has been processed successfully.</p>
            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
            <p><strong>Type:</strong> ${data.paymentType}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  bid_accepted: (data: any) => ({
    subject: "🎉 Your Bid Has Been Accepted!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bid Accepted</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <h2>Your Bid Has Been Accepted!</h2>
            <p><strong>Project:</strong> ${data.projectTitle}</p>
            <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <p>Please contact the customer to proceed with the project.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  new_lead: (data: any) => ({
    subject: "🔥 New Job Lead Available!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Lead</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 New Job Lead!</h1>
          </div>
          <div class="content">
            <h2>A new job lead is available!</h2>
            <p><strong>Job Type:</strong> ${data.jobType}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p>Log in to your dashboard to view details and submit a bid.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
  new_quote: (data: any) => ({
    subject: "💬 New Quote Received",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Quote</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Quote Received</h1>
          </div>
          <div class="content">
            <h2>You have received a new quote!</h2>
            <p><strong>Contractor:</strong> ${data.contractorName}</p>
            <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
            <p>Log in to your dashboard to review and respond to this quote.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

export const sendEmail = async (
  to: string,
  subject: string,
  template: string,
  data: any,
): Promise<{ success: boolean; messageId?: string }> => {
  try {
    // Get template or use provided subject
    const emailTemplate = emailTemplates[template as keyof typeof emailTemplates];
    const emailContent = emailTemplate
      ? emailTemplate(data)
      : { subject, html: data.emailContent || "" };

    const command = new SendEmailCommand({
      Source: "noreply@amazonaws.com", // AWS default sender
      Destination: {
        ToAddresses: [to],
      },
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

    console.log(`📧 [SES] Email sent successfully to ${to}, MessageId: ${result.MessageId}`);
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
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(userEmail, "Payment Receipt - AAS Platform", "payment_receipt", {
      amount,
      paymentId,
      paymentType,
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
  projectTitle: string,
  amount: number,
  customerName: string,
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(
      contractorEmail,
      "🎉 Your Bid Has Been Accepted!",
      "bid_accepted",
      {
        projectTitle,
        amount,
        customerName,
      },
    );

    console.log(
      `🎉 [BID ACCEPTED] Sent to ${contractorEmail}, Project: ${projectTitle}, Amount: $${amount / 100}`,
    );
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_bid_accepted_notification",
      contractorEmail,
    });
    return { success: false };
  }
};

export const sendNewLeadNotification = async (
  contractorEmail: string,
  leadId: string,
  jobType: string,
  location: string,
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(contractorEmail, "🔥 New Job Lead Available!", "new_lead", {
      leadId,
      jobType,
      location,
    });

    console.log(
      `🔥 [NEW LEAD] Sent to ${contractorEmail}, Type: ${jobType}, Location: ${location}`,
    );
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_new_lead_notification",
      contractorEmail,
    });
    return { success: false };
  }
};

export const sendNewQuoteNotification = async (
  customerEmail: string,
  quoteId: string,
  contractorName: string,
  amount: number,
): Promise<{ success: boolean }> => {
  try {
    const result = await sendEmail(customerEmail, "💬 New Quote Received", "new_quote", {
      quoteId,
      contractorName,
      amount,
    });

    console.log(
      `💬 [NEW QUOTE] Sent to ${customerEmail}, Contractor: ${contractorName}, Amount: $${amount / 100}`,
    );
    return { success: result.success };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "send_new_quote_notification",
      customerEmail,
    });
    return { success: false };
  }
};
