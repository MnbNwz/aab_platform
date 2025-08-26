import mongoose from "mongoose";
import { Logger } from "winston";

let dbInstance: typeof mongoose | null = null;

export const connectDB = async (logger?: Logger) => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000, // polling timeout
    });
    const styledMsg = "\x1b[32m\u2714 MongoDB connected\x1b[0m"; // green with checkmark
    if (logger) {
      logger.info(styledMsg);
    } else {
      console.info(styledMsg);
    }
    return dbInstance;
  } catch (err) {
    if (logger) {
      logger.error("MongoDB connection error:", err);
    } else {
      console.error("MongoDB connection error:", err);
    }
    throw err;
  }
};
