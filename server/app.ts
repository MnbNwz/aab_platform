import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectDB } from "@config/db";
import apiRoutes from "@routes/index";
import { appLogger, errorLogger, logErrorWithContext } from "@utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Logger setup (using Pino from utils/logger)

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" })); // Increased limit for other JSON data
app.use(cookieParser());
app.use(
  morgan("combined", {
    stream: { write: (msg: string) => appLogger.info({ request: msg.trim() }) },
  }),
);

// Rate Limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

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

app.listen(PORT, () => {
  appLogger.info({ port: PORT }, `Server listening on port ${PORT}`);
});
