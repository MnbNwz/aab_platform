import { emailColors } from "./colors";

interface PaymentFailedData {
  firstName: string;
  amount: number;
  failureReason: string;
  planName?: string;
  retryUrl?: string;
  supportEmail?: string;
}

export const paymentFailedTemplate = (data: PaymentFailedData) => {
  const {
    amount,
    failureReason,
    planName,
    retryUrl,
    supportEmail = "support@aasplatform.com",
  } = data;

  const subject = "Payment Failed - Action Required";

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
        .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .alert-icon {
            font-size: 48px;
            color: #f39c12;
            margin-bottom: 15px;
        }
        .alert-title {
            font-size: 20px;
            font-weight: bold;
            color: #d68910;
            margin-bottom: 10px;
        }
        .details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
        }
        .detail-value {
            color: #6c757d;
        }
        .failure-reason {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            color: #721c24;
        }
        .cta-button {
            display: inline-block;
            background-color: ${emailColors.primary};
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: ${emailColors.primary[700]};
        }
        .help-section {
            background-color: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .help-title {
            color: #004085;
            font-weight: bold;
            margin-bottom: 10px;
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
            <p>Your payment could not be processed</p>
        </div>

        <div class="alert-box">
            <div class="alert-icon">⚠️</div>
            <div class="alert-title">Payment Failed</div>
            <p>We were unable to process your payment for your ${planName || "membership"}.</p>
        </div>

        <div class="details">
            <h3 style="color: ${emailColors.primary}; margin-top: 0;">Payment Details</h3>
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">$${(amount / 100).toFixed(2)}</span>
            </div>
            ${
              planName
                ? `
            <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${planName}</span>
            </div>
            `
                : ""
            }
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
        </div>

        <div class="failure-reason">
            <strong>Failure Reason:</strong><br>
            ${failureReason}
        </div>

        ${
          retryUrl
            ? `
        <div style="text-align: center;">
            <a href="${retryUrl}" class="cta-button">Update Payment Method</a>
        </div>
        `
            : ""
        }

        <div class="help-section">
            <div class="help-title">What can you do?</div>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Check that your payment method details are correct</li>
                <li>Ensure you have sufficient funds available</li>
                <li>Contact your bank if the issue persists</li>
                <li>Try using a different payment method</li>
            </ul>
        </div>

        <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>Important:</strong> Your membership will remain active until its natural expiration date. Please update your payment method to avoid any service interruption.
        </div>

        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>© 2024 AAS Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;

  return { subject, html };
};
