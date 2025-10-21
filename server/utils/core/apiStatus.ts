import { ENV_CONFIG } from "@config/env";

/**
 * Generates HTML for the API status page
 * @returns HTML string for the API landing page
 */
export const generateApiStatusPage = (): string => {
  const uptime = Math.floor(process.uptime());
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AAS Platform API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 800px;
      width: 100%;
      padding: 40px;
    }
    h1 {
      color: #667eea;
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    .status {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 30px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 1.125rem;
      color: #1f2937;
      font-weight: 600;
    }
    h2 {
      color: #374151;
      font-size: 1.5rem;
      margin: 30px 0 20px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .endpoints {
      list-style: none;
    }
    .endpoint {
      padding: 12px;
      margin: 8px 0;
      background: #f3f4f6;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.95rem;
      color: #374151;
      transition: all 0.2s;
    }
    .endpoint:hover {
      background: #e5e7eb;
      transform: translateX(4px);
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AAS Platform API</h1>
    <div class="status">● RUNNING</div>
    
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Uptime</span>
        <span class="info-value">${hours}h ${minutes}m ${seconds}s</span>
      </div>
      <div class="info-item">
        <span class="info-label">Timestamp</span>
        <span class="info-value">${new Date().toLocaleTimeString()}</span>
      </div>
    </div>

    <h2>📍 Available Endpoints</h2>
    <ul class="endpoints">
      <li class="endpoint">GET /api/</li>
      <li class="endpoint">POST /api/auth/register</li>
      <li class="endpoint">POST /api/auth/login</li>
      <li class="endpoint">GET /api/membership/plans</li>
      <li class="endpoint">GET /api/job/requests</li>
      <li class="endpoint">GET /api/property</li>
      <li class="endpoint">GET /api/investment</li>
      <li class="endpoint">GET /api/dashboard</li>
      <li class="endpoint">GET /api/analytics</li>
    </ul>

    <div class="footer">
      <p>AAS Platform API v1.0.0 | © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
};
