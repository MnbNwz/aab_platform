import { emailColors } from "./colors";

interface BidNotificationData {
  contractorName: string;
  jobTitle: string;
  bidAmount: number;
  jobId: string;
  message?: string;
  viewBidUrl: string;
}

export const bidNotificationTemplate = (data: BidNotificationData) => ({
  subject: `🔨 New Bid Received - ${data.jobTitle} - AAS Platform`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Bid Notification</title>
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
          background: linear-gradient(135deg, ${emailColors.accentPrimary}, ${emailColors.headerBackground});
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
        .bid-details {
          background: linear-gradient(135deg, ${emailColors.primary[50]}, ${emailColors.primary[100]});
          border: 1px solid ${emailColors.accentPrimary};
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
        }
        .bid-amount {
          font-size: 36px;
          font-weight: 700;
          color: ${emailColors.accentPrimary};
          margin: 10px 0;
        }
        .contractor-name {
          font-size: 20px;
          font-weight: 600;
          color: ${emailColors.textPrimary};
          margin-bottom: 15px;
        }
        .job-title {
          font-size: 18px;
          color: ${emailColors.textLight};
          font-style: italic;
        }
        .bid-message {
          background: ${emailColors.primary[50]};
          border-left: 4px solid ${emailColors.accentPrimary};
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          font-style: italic;
          color: ${emailColors.textSecondary};
        }
        .view-bid-button {
          display: inline-block;
          background: linear-gradient(135deg, ${emailColors.accentPrimary}, ${emailColors.accentLight});
          color: white !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: all 0.3s ease;
        }
        .view-bid-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(228, 90, 53, 0.3);
        }
        .action-section {
          background: ${emailColors.primary[50]};
          border: 1px solid ${emailColors.accentPrimary};
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
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
          <h1>🔨 New Bid Received</h1>
        </div>
        <div class="content">
          <h2>Great news! You have a new bid</h2>
          <p>A contractor has submitted a bid for your job request. Here are the details:</p>
          
          <div class="bid-details">
            <div class="contractor-name">👷 ${data.contractorName}</div>
            <div class="job-title">"${data.jobTitle}"</div>
            <div class="bid-amount">$${data.bidAmount.toLocaleString()}</div>
          </div>
          
          ${
            data.message
              ? `
          <div class="bid-message">
            <strong>💬 Contractor's Message:</strong><br>
            "${data.message}"
          </div>
          `
              : ""
          }
          
          <div class="action-section">
            <p><strong>Ready to review this bid?</strong></p>
            <a href="${data.viewBidUrl}" class="view-bid-button">View Full Bid Details</a>
            <p style="font-size: 14px; color: #6c757d; margin-top: 15px;">
              Review the contractor's profile, timeline, and materials before making your decision.
            </p>
          </div>
          
          <p>You can compare this bid with others and accept the one that best fits your needs. Take your time to review all the details before making a decision.</p>
          
          <p><strong>💡 Tip:</strong> Check the contractor's profile, reviews, and proposed timeline to make the best choice for your project.</p>
        </div>
        <div class="footer">
          <p><strong>© 2025 AAS Platform. All rights reserved.</strong></p>
          <p>This notification was sent for job ID: ${data.jobId}</p>
          <p>Manage your job requests in your AAS Platform dashboard.</p>
        </div>
      </div>
    </body>
    </html>
  `,
});
