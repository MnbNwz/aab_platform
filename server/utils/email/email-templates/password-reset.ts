import { emailColors } from "./colors";

interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  otpCode?: string;
}

export const passwordResetTemplate = (data: PasswordResetData) => ({
  subject: "🔒 Password Reset - AAS Platform",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Reset</title>
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
      background: linear-gradient(135deg, ${emailColors.headerBackground}, ${emailColors.cardBackground});
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
    .reset-button {
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
    .reset-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(228, 90, 53, 0.3);
    }
    .otp-code { 
      font-size: 36px; 
      font-weight: 700; 
      color: ${emailColors.accentPrimary}; 
      text-align: center; 
      padding: 30px 20px; 
      background: linear-gradient(135deg, ${emailColors.primary[50]}, ${emailColors.primary[100]});
      border: 2px solid ${emailColors.accentPrimary};
      border-radius: 12px; 
      margin: 30px 0;
      letter-spacing: 4px;
    }
    .url-box {
      background: ${emailColors.primary[50]};
      border: 1px solid ${emailColors.borderColor};
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
      font-size: 14px;
      color: ${emailColors.textSecondary};
    }
    .warning {
      background: ${emailColors.warningColor}20;
      border: 1px solid ${emailColors.warningColor};
      color: ${emailColors.warningColor};
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 500;
    }
    .security-note {
      background: ${emailColors.successColor}20;
      border-left: 4px solid ${emailColors.successColor};
      padding: 15px 20px;
      margin: 20px 0;
      color: ${emailColors.successColor};
      border-radius: 4px;
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
      <h1>🔒 Password Reset</h1>
    </div>
    <div class="content">
      <h2>Hello ${data.firstName},</h2>
      <p>We received a request to reset the password for your <strong>AAS Platform</strong> account. If you made this request, please reset your password using the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" class="reset-button">Reset Password</a>
      </div>

      <div class="warning">
        <strong>⏰ For your security: This link will expire in 1 hour.</strong>
      </div>

      <div class="security-note">
        <strong>🛡️ Important:</strong> If you did not request a password reset, please ignore this email. Your account will remain secure.
      </div>

      <p>If you continue to experience issues, please request a new password reset or contact our support team for assistance.</p>
    </div>
    <div class="footer">
      <p><strong>© ${new Date().getFullYear()} AAS Platform. All rights reserved.</strong></p>
    </div>
  </div>
</body>
</html>
  `,
});
