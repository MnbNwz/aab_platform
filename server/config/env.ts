import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Centralized environment configuration
 * All environment variables are loaded, validated, and typed here
 * Use these constants throughout the application instead of process.env
 */

// Helper function to get required env var
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Helper function to get optional env var with default
const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// Helper function to get boolean env var
const getBooleanEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
};

// Helper function to get number env var
const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
};

/**
 * Application Configuration
 */
export const ENV_CONFIG = {
  PORT: getNumberEnv("PORT", 5000),
  LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info"),

  // Database
  MONGO_URI: getRequiredEnv("MONGO_URI"),

  // Authentication & Security
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  SECURE_COOKIES: getBooleanEnv("SECURE_COOKIES", true), // Default to true for security
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN, // Optional, can be undefined

  // Frontend
  FRONTEND_URL: getRequiredEnv("FRONTEND_URL"),

  // Stripe Payment
  STRIPE_SECRET_KEY: getRequiredEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET, // Optional for local dev

  // AWS S3
  AWS_S3_BUCKET: getRequiredEnv("AWS_S3_BUCKET"),
  AWS_REGION: getRequiredEnv("AWS_REGION"),
  AWS_ACCESS_KEY_ID: getRequiredEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),

  // SMTP Email Configuration
  SMTP: {
    HOST: getRequiredEnv("SMTP_HOST"),
    PORT: getNumberEnv("SMTP_PORT", 587),
    SECURE: getBooleanEnv("SMTP_SECURE", false),
    USER: getRequiredEnv("SMTP_USER"),
    PASS: getRequiredEnv("SMTP_PASS"),
    FROM_NAME: getOptionalEnv("SMTP_FROM_NAME", "AAS Platform"),
    FROM_EMAIL: getOptionalEnv("SMTP_FROM_EMAIL", process.env.SMTP_USER || ""),
    REPLY_TO: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    TEST_EMAIL: process.env.SMTP_TEST_EMAIL,

    // TLS Configuration
    TLS_REJECT_UNAUTHORIZED: getBooleanEnv("SMTP_TLS_REJECT_UNAUTHORIZED", true),

    // Timeout Configuration
    CONNECTION_TIMEOUT: getNumberEnv("SMTP_CONNECTION_TIMEOUT", 60000),
    GREETING_TIMEOUT: getNumberEnv("SMTP_GREETING_TIMEOUT", 30000),
    SOCKET_TIMEOUT: getNumberEnv("SMTP_SOCKET_TIMEOUT", 60000),

    // Pool Configuration
    POOL: getBooleanEnv("SMTP_POOL", false),
    MAX_CONNECTIONS: getNumberEnv("SMTP_MAX_CONNECTIONS", 5),
    MAX_MESSAGES: getNumberEnv("SMTP_MAX_MESSAGES", 100),
    RATE_DELTA: getNumberEnv("SMTP_RATE_DELTA", 1000),
    RATE_LIMIT: getNumberEnv("SMTP_RATE_LIMIT", 5),

    // Retry Configuration
    MAX_RETRIES: getNumberEnv("SMTP_MAX_RETRIES", 3),
    RETRY_DELAY: getNumberEnv("SMTP_RETRY_DELAY", 2000),

    // DKIM Configuration (optional)
    DKIM: {
      PRIVATE_KEY: process.env.SMTP_DKIM_PRIVATE_KEY,
      DOMAIN: process.env.SMTP_DKIM_DOMAIN,
      KEY_SELECTOR: process.env.SMTP_DKIM_KEY_SELECTOR,
    },
  },
} as const;

// Validate critical configuration on startup
export const validateConfig = (): void => {
  try {
    // These are already validated by getRequiredEnv, but we can add additional validation here
    if (ENV_CONFIG.PORT < 1 || ENV_CONFIG.PORT > 65535) {
      throw new Error(`Invalid PORT: ${ENV_CONFIG.PORT}. Must be between 1 and 65535`);
    }

    if (ENV_CONFIG.JWT_SECRET.length < 32) {
      console.warn("WARNING: JWT_SECRET should be at least 32 characters long for security");
    }

    console.log("✅ Environment configuration validated successfully");
  } catch (error) {
    console.error("❌ Environment configuration validation failed:", error);
    throw error;
  }
};
