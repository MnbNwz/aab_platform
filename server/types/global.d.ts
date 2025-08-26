import { IUser } from "../models/types/user";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      [key: string]: string | undefined;
    }
  }
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
