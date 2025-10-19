import mongoose from "mongoose";
import { logErrorWithContext } from "@utils/core";
import { ENV_CONFIG } from "./env";

let dbInstance: typeof mongoose | null = null;

export const connectDB = async () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await mongoose.connect(ENV_CONFIG.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // polling timeout
    });
    console.log("MongoDB connected successfully");
    return dbInstance;
  } catch (err) {
    logErrorWithContext(err as Error, { operation: "mongodb_connection" });
    throw err;
  }
};

export const disconnectDB = async () => {
  if (dbInstance) {
    try {
      await mongoose.disconnect();
      dbInstance = null;
      console.log("MongoDB disconnected successfully");
    } catch (err) {
      logErrorWithContext(err as Error, { operation: "mongodb_disconnection" });
      throw err;
    }
  }
};
