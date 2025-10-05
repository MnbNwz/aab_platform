import type { ApiResponse, PaginationInfo } from "../types";
import showToast from "../utils/toast";

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
      throw createApiError("Request timeout Please refresh the page", 408);
    }
    throw createApiError(ERROR_MESSAGES.NETWORK_ERROR, 0);
  }
};

const get = <T = any>(endpoint: string): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, { method: "GET" });

export interface PaymentMembership {
  _id: string;
  userId: string;
  planId: string;
  paymentId: string;
  status: "active" | "inactive" | "cancelled" | "expired";
  billingPeriod: "monthly" | "yearly";
  billingType: "recurring" | "one_time";
  startDate: string;
  endDate?: string;
  isAutoRenew: boolean;
  leadsUsedThisMonth: number;
  lastLeadResetDate: string;
  createdAt: string;
  updatedAt: string;
  plan: {
    _id: string;
    name: string;
    tier: string;
  };
}

export interface PaymentJobDetails {
  _id: string;
  title: string;
  service: string;
  status: string;
}

export interface Payment {
  _id: string;
  userId: string;
  email: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "cancelled";
  stripeCustomerId: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  billingPeriod?: "monthly" | "yearly";
  failureReason?: string;
  planId?: string;
  purpose?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  membership?: PaymentMembership | null;
  jobDetails?: PaymentJobDetails | null;
}

export interface PaymentHistoryResponse {
  data: Payment[];
  pagination: PaginationInfo;
}

export interface PaymentHistoryApiResponse {
  success: boolean;
  data: Payment[];
  pagination: PaginationInfo;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: Payment["status"];
  type?: "membership" | "job";
  startDate?: string;
  endDate?: string;
}

export const paymentService = {
  getHistory: async (
    filters: PaymentFilters = {}
  ): Promise<PaymentHistoryApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.status) params.append("status", filters.status);
      if (filters.type) params.append("type", filters.type);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const endpoint = `/api/payment/history${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const url = `${API_CONFIG.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (!response.ok) {
        throw createApiError(
          response.status === 401 || response.status === 403
            ? ERROR_MESSAGES.UNAUTHORIZED
            : "Failed to fetch payment history",
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      showToast.error("Failed to fetch payment history");
      throw err;
    }
  },

  getPaymentDetail: async (
    paymentId: string
  ): Promise<ApiResponse<Payment>> => {
    try {
      return get<Payment>(`/api/payment/${paymentId}`);
    } catch (err: any) {
      showToast.error("Failed to fetch payment details");
      throw err;
    }
  },
};
