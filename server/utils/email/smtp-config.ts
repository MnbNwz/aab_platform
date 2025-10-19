import { ENV_CONFIG } from "@config/env";

/**
 * SMTP Configuration interface
 */
export interface SMTPConfiguration {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  testEmail?: string;
  tls: {
    rejectUnauthorized: boolean;
  };
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
}

/**
 * Get SMTP configuration from environment variables
 */
export const getSMTPConfig = (): SMTPConfiguration => {
  const config: SMTPConfiguration = {
    host: ENV_CONFIG.SMTP.HOST,
    port: ENV_CONFIG.SMTP.PORT,
    secure: ENV_CONFIG.SMTP.SECURE,
    user: ENV_CONFIG.SMTP.USER,
    pass: ENV_CONFIG.SMTP.PASS,
    fromName: ENV_CONFIG.SMTP.FROM_NAME,
    fromEmail: ENV_CONFIG.SMTP.FROM_EMAIL,
    replyTo: ENV_CONFIG.SMTP.REPLY_TO!,
    testEmail: ENV_CONFIG.SMTP.TEST_EMAIL,
    tls: {
      rejectUnauthorized: ENV_CONFIG.SMTP.TLS_REJECT_UNAUTHORIZED,
    },
  };

  // Add DKIM configuration if available
  if (ENV_CONFIG.SMTP.DKIM.PRIVATE_KEY) {
    config.dkim = {
      domainName: ENV_CONFIG.SMTP.DKIM.DOMAIN!,
      keySelector: ENV_CONFIG.SMTP.DKIM.KEY_SELECTOR!,
      privateKey: ENV_CONFIG.SMTP.DKIM.PRIVATE_KEY,
    };
  }

  return config;
};

/**
 * Validate SMTP configuration
 */
export const validateSMTPConfig = (
  config: SMTPConfiguration,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.host) errors.push("SMTP_HOST is required");
  if (!config.port) errors.push("SMTP_PORT is required");
  if (!config.user) errors.push("SMTP_USER is required");
  if (!config.pass) errors.push("SMTP_PASS is required");

  return {
    valid: errors.length === 0,
    errors,
  };
};
