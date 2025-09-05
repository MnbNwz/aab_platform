import type { ApiResponse } from "../types";

const API_CONFIG = {
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:5000",
  timeout: 30000,
} as const;

const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  UNAUTHORIZED: "Access denied. Please log in again.",
} as const;

export interface ApiError {
  name: "ApiError";
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

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

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as any).name === "ApiError"
  );
};

const makeRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const config: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
    ...options,
  };
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
    if (response.status === 401) {
      throw createApiError(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }
    if (response.status === 403) {
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
    throw createApiError(ERROR_MESSAGES.NETWORK_ERROR, 0);
  }
};

const get = <T = any>(endpoint: string): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, { method: "GET" });

export const membershipService = {
  getCurrent: async () => {
    return get("/api/membership/current");
  },
  getPlans: async (userType: "customer" | "contractor" | "admin") => {
    return userType === "admin"
      ? get(`/api/membership/plans`)
      : get(`/api/membership/plans/${userType}`);
  },
};
