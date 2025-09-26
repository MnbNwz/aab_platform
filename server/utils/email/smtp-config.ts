// SMTP Configuration interface and validation
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  testEmail?: string;
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

export const getSMTPConfig = (): SMTPConfig => {
  const config: SMTPConfig = {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "AAS Platform",
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    testEmail: process.env.SMTP_TEST_EMAIL,
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  };

  // Add DKIM configuration if available
  if (process.env.SMTP_DKIM_PRIVATE_KEY) {
    config.dkim = {
      domainName: process.env.SMTP_DKIM_DOMAIN || "",
      keySelector: process.env.SMTP_DKIM_KEY_SELECTOR || "",
      privateKey: process.env.SMTP_DKIM_PRIVATE_KEY,
    };
  }

  return config;
};

export const validateSMTPConfig = (config: SMTPConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.host) errors.push("SMTP_HOST is required");
  if (!config.user) errors.push("SMTP_USER is required");
  if (!config.pass) errors.push("SMTP_PASS is required");
  if (!config.fromEmail) errors.push("SMTP_FROM_EMAIL is required");

  if (config.dkim) {
    if (!config.dkim.domainName) errors.push("SMTP_DKIM_DOMAIN is required when DKIM is enabled");
    if (!config.dkim.keySelector)
      errors.push("SMTP_DKIM_KEY_SELECTOR is required when DKIM is enabled");
    if (!config.dkim.privateKey)
      errors.push("SMTP_DKIM_PRIVATE_KEY is required when DKIM is enabled");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
