import mongoose from "mongoose";
import { logErrorWithContext } from "@utils/core";

let dbInstance: typeof mongoose | null = null;

export const connectDB = async () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await mongoose.connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000, // polling timeout
    });
    console.log("MongoDB connected successfully");
    return dbInstance;
  } catch (err) {
    logErrorWithContext(err as Error, { operation: "mongodb_connection" });
    throw err;
  }
};
