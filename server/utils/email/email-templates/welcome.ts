import { emailColors } from "./colors";

interface WelcomeData {
  firstName: string;
  role: "customer" | "contractor";
  dashboardUrl: string;
}

export const welcomeTemplate = (data: WelcomeData) => ({
  subject: `🎉 Welcome to AAS Platform, ${data.firstName}!`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to AAS Platform</title>
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
        .welcome-message {
          background: linear-gradient(135deg, ${emailColors.primary[50]}, ${emailColors.primary[100]});
          border: 1px solid ${emailColors.accentPrimary};
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
        }
        .role-specific {
          background: ${emailColors.primary[50]};
          border-left: 4px solid ${emailColors.accentPrimary};
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .feature-list {
          list-style: none;
          padding: 0;
        }
        .feature-list li {
          padding: 10px 0;
          border-bottom: 1px solid ${emailColors.borderColor};
          color: ${emailColors.textSecondary};
        }
        .feature-list li:last-child {
          border-bottom: none;
        }
        .feature-list li:before {
          content: "✅ ";
          color: ${emailColors.successColor};
          font-weight: bold;
        }
        .dashboard-button {
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
        .dashboard-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(228, 90, 53, 0.3);
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
          <h1>🎉 Welcome to AAS Platform!</h1>
        </div>
        <div class="content">
          <div class="welcome-message">
            <h2>Hello ${data.firstName}!</h2>
            <p>Welcome to AAS Platform - your gateway to professional ${data.role === "customer" ? "home services" : "contracting opportunities"}!</p>
          </div>
          
          <p>We're thrilled to have you join our community of ${data.role === "customer" ? "homeowners and property managers" : "skilled contractors and service professionals"}.</p>
          
          <div class="role-specific">
            ${
              data.role === "customer"
                ? `
            <h3>🏠 As a Customer, you can:</h3>
            <ul class="feature-list">
              <li>Post job requests and get competitive bids</li>
              <li>Browse verified contractors in your area</li>
              <li>Manage your properties and service history</li>
              <li>Make secure payments with buyer protection</li>
              <li>Rate and review contractors after job completion</li>
            </ul>
            `
                : `
            <h3>🔨 As a Contractor, you can:</h3>
            <ul class="feature-list">
              <li>Browse and bid on local job opportunities</li>
              <li>Showcase your skills and build your reputation</li>
              <li>Manage your projects and client communications</li>
              <li>Receive secure payments through our platform</li>
              <li>Access leads based on your membership plan</li>
            </ul>
            `
            }
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" class="dashboard-button">
              🚀 Get Started - Visit Dashboard
            </a>
          </div>
          
          <p><strong>💡 Next Steps:</strong></p>
          <p>${
            data.role === "customer"
              ? "Complete your profile, add your properties, and post your first job request to get started!"
              : "Complete your contractor profile, upload your credentials, and start browsing available jobs in your area!"
          }</p>
          
          <p>If you have any questions or need assistance, our support team is here to help. Welcome aboard!</p>
        </div>
        <div class="footer">
          <p><strong>© 2025 AAS Platform. All rights reserved.</strong></p>
          <p>You're receiving this email because you created an account with us.</p>
          <p>Need help? Contact our support team anytime.</p>
        </div>
      </div>
    </body>
    </html>
  `,
});
