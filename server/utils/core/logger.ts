import pino from "pino";

/**
 * Comprehensive logging utility using Pino
 * Replaces all console.log/error/warn/info across the system
 */

// Create Pino logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

// Enhanced logger with context
const createLogger = (context: string) => {
  return logger.child({ context });
};

// Application logger
export const appLogger = createLogger("app");

// Error logger
export const errorLogger = createLogger("error");

// Error tracking with context
export const logErrorWithContext = (
  error: Error,
  context: {
    operation?: string;
    userId?: string;
    requestId?: string;
    additionalData?: any;
    [key: string]: any; // Allow additional properties
  },
) => {
  errorLogger.error(
    {
      error: error.message,
      stack: error.stack,
      ...context,
    },
    `Error in ${context.operation || "unknown operation"}`,
  );
};
