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
      user?: import("../types/auth").SanitizedUser;
    }
  }
}

export {};
