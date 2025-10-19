import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB, disconnectDB, ENV_CONFIG, validateConfig } from "@config/index";
import apiRoutes from "@routes/index";
import { appLogger, logErrorWithContext } from "@utils/core";

// Validate environment configuration on startup
validateConfig();

const app = express();
const PORT = ENV_CONFIG.PORT;

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Logger setup (using Pino from utils/logger)

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({ origin: ENV_CONFIG.FRONTEND_URL || true, credentials: true }));

// Special handling for Stripe webhooks - must be before express.json()
app.use("/api/payment/webhook/stripe", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" })); // Increased limit for other JSON data
app.use(cookieParser());
app.use(
  morgan("combined", {
    stream: { write: (msg: string) => appLogger.info({ request: msg.trim() }) },
  }),
);

app.use(limiter);

// MongoDB connection (singleton)
connectDB().catch((err: Error) => logErrorWithContext(err, { operation: "database_connection" }));

// Routes
app.use("/api", apiRoutes);

// 404 fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logErrorWithContext(err, {
    operation: "express_error_handler",
    requestId: req.headers["x-request-id"] as string,
    additionalData: {
      url: req.url,
      method: req.method,
    },
  });
  res.status(500).json({ error: "Internal Server Error" });
});

const server = app.listen(PORT, () => {
  appLogger.info({ port: PORT }, `Server listening on port ${PORT}`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  appLogger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    appLogger.info("HTTP server closed.");

    // Close database connection
    try {
      await disconnectDB();
      appLogger.info("Database connection closed.");
      process.exit(0);
    } catch (err) {
      appLogger.error({ error: err }, "Error closing database connection");
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    appLogger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 30000);
};

// Handle process signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logErrorWithContext(err, { operation: "uncaught_exception" });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logErrorWithContext(new Error(`Unhandled Rejection: ${reason}`), {
    operation: "unhandled_rejection",
    promise: promise.toString(),
  });
  process.exit(1);
});
