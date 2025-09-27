import { emailColors } from "./colors";

interface PaymentReceiptData {
  firstName: string;
  amount: number;
  paymentId: string;
  paymentType: "membership" | "job" | "offmarket";
  planName?: string;
  jobTitle?: string;
  date: string;
}

export const paymentReceiptTemplate = (data: PaymentReceiptData) => ({
  subject: `💳 Payment Receipt - $${(data.amount / 100).toFixed(2)} - AAS Platform`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Receipt</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6; 
          color: ${emailColors.textPrimary}; 
          margin: 0; 
          padding: 0;
          background-color: ${emailColors.background};
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .header { 
          background: linear-gradient(135deg, ${emailColors.successColor}, ${emailColors.cardBackground});
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px; 
          background: white;
        }
        .content h2 {
          color: ${emailColors.textPrimary};
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .content p {
          color: ${emailColors.textSecondary};
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .receipt-details {
          background: ${emailColors.primary[50]};
          border: 1px solid ${emailColors.borderColor};
          border-radius: 8px;
          padding: 30px;
          margin: 30px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid ${emailColors.borderColor};
        }
        .detail-row:last-child {
          border-bottom: none;
          font-weight: 600;
          font-size: 18px;
          color: ${emailColors.successColor};
        }
        .detail-label {
          color: ${emailColors.textLight};
          font-weight: 500;
        }
        .detail-value {
          color: ${emailColors.textPrimary};
          font-weight: 600;
        }
        .amount-highlight {
          font-size: 32px;
          font-weight: 700;
          color: ${emailColors.successColor};
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, ${emailColors.primary[50]}, ${emailColors.primary[100]});
          border-radius: 12px;
          margin: 30px 0;
        }
        .success-badge {
          background: ${emailColors.successColor}20;
          color: ${emailColors.successColor};
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          display: inline-block;
        }
        .footer { 
          text-align: center; 
          padding: 30px; 
          background: ${emailColors.primary[50]};
          color: ${emailColors.textLight}; 
          font-size: 14px;
          border-top: 1px solid ${emailColors.borderColor};
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Payment Receipt</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>Thank you for your payment. Here are the details of your successful transaction:</p>
          
          <div class="amount-highlight">$${(data.amount / 100).toFixed(2)}</div>
          
          <div style="text-align: center; margin: 20px 0;">
            <span class="success-badge">✅ Payment Successful</span>
          </div>
          
          <div class="receipt-details">
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value">${data.paymentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${data.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Type:</span>
              <span class="detail-value">${data.paymentType.charAt(0).toUpperCase() + data.paymentType.slice(1)}</span>
            </div>
            ${
              data.planName
                ? `
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${data.planName}</span>
            </div>
            `
                : ""
            }
            ${
              data.jobTitle
                ? `
            <div class="detail-row">
              <span class="detail-label">Job:</span>
              <span class="detail-value">${data.jobTitle}</span>
            </div>
            `
                : ""
            }
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value">$${(data.amount / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <p>This receipt serves as confirmation of your payment. Please keep this email for your records.</p>
          <p>If you have any questions about this payment, please contact our support team with your payment ID.</p>
        </div>
        <div class="footer">
          <p><strong>© ${new Date().getFullYear()} AAS Platform. All rights reserved.</strong></p>
          <p>This is an automated receipt for your payment.</p>
          <p>For support, contact us with payment ID: ${data.paymentId}</p>
        </div>
      </div>
    </body>
    </html>
  `,
});
