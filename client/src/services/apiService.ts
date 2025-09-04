import type {
  ApiResponse,
  LoginCredentials,
  AuthResponse,
  User,
} from "../types";

// Simple error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  UNAUTHORIZED: "Access denied. Please log in again.",
} as const;

// Custom error type for API errors
export interface ApiError {
  name: "ApiError";
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Helper function to create API errors
const createApiError = (
  message: string,
  status: number,
  errors?: Record<string, string[]>
): ApiError => ({
  name: "ApiError",
  message,
  status,
  errors,
});

// Helper function to check if error is ApiError
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ApiError"
  );
};

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
  timeout: 30000,
} as const;

// Core request function with security best practices
const makeRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  const config: RequestInit = {
    credentials: "include", // REQUIRED for auth cookies
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // CSRF protection
      ...options.headers,
    },
    ...options,
  };

  console.log(`📡 API Request: ${options.method || "GET"} ${url}`);
  if (options.body) {
    console.log(`📦 Request Body:`, JSON.parse(options.body as string));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    console.log(`📦 Response Data:`, data);

    // Handle different HTTP status codes
    if (response.status === 401) {
      // Unauthorized - let the component handle the error
      console.log("🔒 Unauthorized request");
      throw createApiError(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }

    if (response.status === 403) {
      // Forbidden - no permission
      throw createApiError(ERROR_MESSAGES.UNAUTHORIZED, 403);
    }

    if (!response.ok) {
      throw createApiError(
        data?.message || ERROR_MESSAGES.GENERIC_ERROR,
        response.status,
        data?.errors
      );
    }

    return {
      success: true,
      data: data?.data || data,
      message: data?.message || "Success",
    };
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw createApiError("Request timeout", 408);
    }

    // Network or other errors
    throw createApiError(ERROR_MESSAGES.NETWORK_ERROR, 0);
  }
};

// HTTP method helpers
const get = <T = any>(endpoint: string): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, { method: "GET" });

const post = <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });

const put = <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });

const del = <T = any>(endpoint: string): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, { method: "DELETE" });

// Authentication API functions
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await post<AuthResponse>("/api/auth/signin", {
      email: credentials.email,
      password: credentials.password,
    });
    return response.data!;
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const response = await post<AuthResponse>("/api/auth/signup", userData);
    return response.data!;
  },

  logout: async (): Promise<void> => {
    await post("/api/auth/logout");
  },

  getProfile: async (): Promise<User> => {
    const response = await get<User>("/api/auth/profile");
    return response.data!;
  },
} as const;

// Services API
const servicesApi = {
  getServices: async (): Promise<{ services: string[]; version: number; lastUpdated: string }> => {
    const response = await get<{ services: string[]; version: number; lastUpdated: string }>("/api/services");
    return response.data!;
  },
} as const;

// Export API functions
export const api = {
  auth: authApi,
  services: servicesApi,
  get,
  post,
  put,
  delete: del,
} as const;

// Utility functions for error handling
export const handleApiError = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  return ERROR_MESSAGES.GENERIC_ERROR;
};

export const getValidationErrors = (
  error: unknown
): Record<string, string[]> => {
  if (isApiError(error) && error.errors) {
    return error.errors;
  }
  return {};
};
