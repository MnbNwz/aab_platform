// API-related types

export interface ApiError {
  name: "ApiError";
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

export interface CachedEntry<T> {
  expiresAt: number;
  value: T;
}
