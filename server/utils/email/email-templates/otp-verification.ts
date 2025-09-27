import { emailColors } from "./colors";

interface OTPVerificationData {
  firstName: string;
  otpCode: string;
}

export const otpVerificationTemplate = (data: OTPVerificationData) => ({
  subject: "🔐 Verify Your Email - AAS Platform",
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Email Verification</title>
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
        .warning {
          background: ${emailColors.warningColor}20;
          border: 1px solid ${emailColors.warningColor};
          color: ${emailColors.warningColor};
          padding: 15px 20px;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 500;
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
        .security-note {
          background: ${emailColors.successColor}20;
          border-left: 4px solid ${emailColors.successColor};
          padding: 15px 20px;
          margin: 20px 0;
          color: ${emailColors.successColor};
          border-radius: 4px;
        }
      </style>
    </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName},</h2>
            <p>Please use the code below to verify your email and complete your registration with <strong>AAS Platform</strong>:</p>
            <div class="otp-code">${data.otpCode}</div>
            <div class="security-note">
              <strong>🛡️ Security Reminder:</strong> Do not share this code with anyone. <strong>AAS Platform</strong> will never ask for it.
            </div>

            <p>If you didn’t request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p><strong>© ${new Date().getFullYear()} AAS Platform. All rights reserved.</strong></p>
            <p>Need help? Contact <a href="mailto:support@aasplatform.com">support@aasplatform.com</a>.</p>
          </div>
        </div>
      </body>
    </html>
  `,
});
