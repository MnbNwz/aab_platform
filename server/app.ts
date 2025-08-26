import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import winston from "winston";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import apiRoutes from "./routes/index";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Winston logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined", { stream: { write: (msg: string) => logger.info(msg.trim()) } }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// MongoDB connection (singleton)
connectDB(logger).catch((err: Error) => logger.error("MongoDB connection error:", err));

// Routes
app.use("/api", apiRoutes);

// 404 fallback
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
