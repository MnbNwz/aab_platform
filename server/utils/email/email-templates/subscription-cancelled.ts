import { emailColors } from "./colors";

interface SubscriptionCancelledData {
  firstName: string;
  planName: string;
  expiryDate: Date;
  supportEmail?: string;
}

export const subscriptionCancelledTemplate = (data: SubscriptionCancelledData) => {
  const { firstName, planName, expiryDate, supportEmail = "support@aasplatform.com" } = data;

  const subject = "Auto-Renewal Disabled";

  const formattedDate = new Date(expiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${emailColors.primary};
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: ${emailColors.primary};
            margin-bottom: 10px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid ${emailColors.primary};
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-title {
            font-weight: bold;
            color: ${emailColors.primary};
            margin-bottom: 10px;
            font-size: 16px;
        }
        .details {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        .detail-value {
            color: #6c757d;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .footer a {
            color: ${emailColors.primary};
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AAS Platform</div>
            <p>Auto-Renewal Update</p>
        </div>

        <p>Hi ${firstName},</p>

        <div class="info-box">
            <div class="info-title">✓ Auto-renewal has been disabled</div>
            <p style="margin: 0;">Your subscription will not renew automatically. You'll retain full access until the end of your current billing period.</p>
        </div>

        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Access Until:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul style="color: #6c757d;">
            <li>Your membership remains active until <strong>${formattedDate}</strong></li>
            <li>All features remain available during this period</li>
            <li>No further charges will be made</li>
            <li>You can re-enable auto-renewal anytime from your account</li>
        </ul>

        <div class="footer">
            <p>Questions? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>© 2024 AAS Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
};
