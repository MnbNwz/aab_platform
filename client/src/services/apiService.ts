import type {
  ApiResponse,
  LoginCredentials,
  AuthResponse,
  User,
  UserVerification,
  UserStats,
  UsersResponse,
  UserFilters,
  UserUpdateData,
} from "../types";
import type { ApiError } from "../types/api";
import type { ServicesResponse } from "../types/service";

// Simple error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  UNAUTHORIZED: "Access denied. Please log in again.",
} as const;

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

// Advanced caching with per-endpoint TTL and invalidation
import type { CachedEntry } from "../types/api";
const inFlightRequests = new Map<string, Promise<any>>();
const getCache = new Map<string, CachedEntry<ApiResponse<any>>>();

// Per-endpoint cache TTL configuration
const CACHE_TTL_CONFIG = {
  // Highly dynamic - short cache
  "/api/dashboard": 12000, // 12s for dashboard data
  "/api/admin/users/stats": 15000, // 15s for user stats
  "/api/admin/users": 10000, // 10s for user lists

  // Semi-static - medium cache
  "/api/services": 30000, // 30s for services list
  "/api/auth/profile": 60000, // 1min for user profile

  // Static - longer cache
  "/api/membership/plans": 300000, // 5min for membership plans

  // Default fallback
  default: 8000, // 8s default
} as const;

// Cache invalidation patterns
const INVALIDATION_PATTERNS = {
  // When user management actions occur, invalidate related caches
  userManagement: [
    "/api/admin/users",
    "/api/admin/users/stats",
    "/api/dashboard",
  ],
  // When profile updates occur, invalidate profile cache
  profile: ["/api/auth/profile"],
  // When services change, invalidate services cache
  services: ["/api/services"],
} as const;

// Helper to get cache TTL for an endpoint
const getCacheTTL = (endpoint: string): number => {
  for (const [pattern, ttl] of Object.entries(CACHE_TTL_CONFIG)) {
    if (pattern !== "default" && endpoint.includes(pattern)) {
      return ttl;
    }
  }
  return CACHE_TTL_CONFIG.default;
};

// Helper to invalidate caches by pattern
const invalidateCaches = (
  pattern: keyof typeof INVALIDATION_PATTERNS
): void => {
  const patterns = INVALIDATION_PATTERNS[pattern];
  for (const [cacheKey] of getCache.entries()) {
    if (patterns.some((pattern) => cacheKey.includes(pattern))) {
      getCache.delete(cacheKey);
    }
  }
};

// Core request function with security best practices
const makeRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();
  const cacheKey = `${method}:${endpoint}`;

  // Serve short-cache for GET
  if (method === "GET") {
    const cached = getCache.get(cacheKey) as CachedEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as ApiResponse<T>;
    }
    const existing = inFlightRequests.get(cacheKey) as
      | Promise<ApiResponse<T>>
      | undefined;
    if (existing) return existing;
  }

  // Detect FormData for multipart
  let headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (
    options.headers &&
    typeof options.headers === "object" &&
    !(options.headers instanceof Headers) &&
    !Array.isArray(options.headers)
  ) {
    headers = { ...headers, ...options.headers };
  }
  let body = options.body;
  if (body instanceof FormData) {
    // Let browser set Content-Type with boundary
    delete headers["Content-Type"];
  } else if (body && typeof body === "object" && !(body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  } else if (body) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    credentials: "include",
    headers,
    ...options,
    body,
  };

  // Create a promise for the entire request flow to handle in-flight deduplication correctly
  const executeRequest = async (): Promise<ApiResponse<T>> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
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

      // Handle different HTTP status codes
      if (response.status === 401) {
        // Unauthorized - let the component handle the error
        throw createApiError(ERROR_MESSAGES.UNAUTHORIZED, 401);
      }

      if (response.status === 403) {
        // Forbidden - no permission
        throw createApiError(ERROR_MESSAGES.UNAUTHORIZED, 403);
      }

      if (!response.ok) {
        throw createApiError(
          data?.message || data?.error || ERROR_MESSAGES.GENERIC_ERROR,
          response.status,
          data?.errors
        );
      }

      const apiResponse: ApiResponse<T> = {
        success: true,
        data: data?.data || data,
        message: data?.message || "Success",
        ...(data?.pagination && { pagination: data.pagination }),
      };

      // Cache GET responses with per-endpoint TTL
      if (method === "GET") {
        const ttl = getCacheTTL(endpoint);
        getCache.set(cacheKey, {
          expiresAt: Date.now() + ttl,
          value: apiResponse,
        });
      }
      return apiResponse;
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw createApiError("Request timeout Please refresh the page", 408);
      }

      // Network or other errors
      throw createApiError(ERROR_MESSAGES.NETWORK_ERROR, 0);
    } finally {
      if (method === "GET") inFlightRequests.delete(cacheKey);
    }
  };

  // For GET requests, store the promise for the entire request flow
  if (method === "GET") {
    const requestPromise = executeRequest();
    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  return executeRequest();
};

// HTTP method helpers
const get = <T = any>(endpoint: string): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, { method: "GET" });

const post = <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "POST",
    body: data instanceof FormData ? data : data ? data : undefined,
  });

const put = <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "PUT",
    body:
      data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
  });

const patch = <T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "PATCH",
    body:
      data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
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

  updateProfile: async (
    userId: string,
    userData: Partial<User>
  ): Promise<User> => {
    const response = await put<User>(`/api/user/${userId}`, userData);
    // Invalidate profile cache after update
    invalidateCaches("profile");
    return response.data;
  },

  updateProfileWithFormData: async (
    userId: string,
    formData: FormData
  ): Promise<User> => {
    const response = await put<User>(`/api/user/${userId}`, formData);
    // Invalidate profile cache after update
    invalidateCaches("profile");
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await put("/api/user/change-password", passwordData);
  },

  verifyOTP: async (
    email: string,
    otpCode: string
  ): Promise<{
    message: string;
    user: User;
    userVerification: UserVerification;
  }> => {
    const response = await post<{
      message: string;
      user: User;
      userVerification: UserVerification;
    }>("/api/auth/verify-otp", {
      email,
      otpCode,
    });
    return response.data;
  },

  resendOTP: async (
    email: string
  ): Promise<{
    message: string;
    userVerification: UserVerification;
  }> => {
    const response = await post<{
      message: string;
      userVerification: UserVerification;
    }>("/api/auth/resend-otp", { email });
    return response.data;
  },

  getVerificationState: async (email: string): Promise<UserVerification> => {
    const response = await get<UserVerification>(
      `/api/auth/verification-state?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  // Password Reset APIs
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await post<{ message: string }>(
      "/api/auth/forgot-password",
      { email }
    );
    return response.data;
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<{ message: string; user: User }> => {
    const response = await post<{ message: string; user: User }>(
      "/api/auth/reset-password",
      {
        token,
        newPassword,
      }
    );
    return response.data;
  },
} as const;

// Services API
const servicesApi = {
  getServices: async (): Promise<ServicesResponse> => {
    const response = await get<ServicesResponse>("/api/services");
    return response.data!;
  },

  createServices: async (services: string[]): Promise<ServicesResponse> => {
    const response = await post<ServicesResponse>("/api/services", {
      services,
    });
    // Invalidate services cache after creation
    invalidateCaches("services");
    return response.data!;
  },
} as const;

// User Management API (Admin only)
const userManagementApi = {
  // Get user statistics for dashboard
  getStats: async (): Promise<UserStats> => {
    const response = await get<{ stats: UserStats }>("/api/admin/users/stats");
    return response.data.stats;
  },

  // Get users with filtering and pagination
  getUsers: async (filters: UserFilters = {}): Promise<UsersResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ""}`;

    const response = await get<UsersResponse>(endpoint);
    return response.data;
  },

  // Get single user details
  getUser: async (userId: string): Promise<User> => {
    const response = await get<{ user: User }>(`/api/admin/users/${userId}`);
    return response.data.user;
  },

  // Update user status/approval
  updateUser: async (
    userId: string,
    updateData: UserUpdateData
  ): Promise<User> => {
    const response = await put<{ user: User }>(
      `/api/admin/users/${userId}`,
      updateData
    );
    // Invalidate related caches after user update
    invalidateCaches("userManagement");
    return response.data.user;
  },

  // Revoke user (soft delete)
  revokeUser: async (userId: string): Promise<void> => {
    await del(`/api/admin/users/${userId}`);
    // Invalidate related caches after user revocation
    invalidateCaches("userManagement");
  },

  // Quick approval action
  approveUser: async (userId: string): Promise<User> => {
    return userManagementApi.updateUser(userId, {
      status: "active",
      approval: "approved",
    });
  },

  // Quick rejection action
  rejectUser: async (userId: string): Promise<User> => {
    return userManagementApi.updateUser(userId, {
      approval: "rejected",
    });
  },
} as const;

// Export API functions
export const api = {
  auth: authApi,
  services: servicesApi,
  userManagement: userManagementApi,
  get,
  post,
  put,
  patch,
  delete: del,
  // Cache management utilities
  invalidateCaches,
  clearAllCaches: () => {
    getCache.clear();
    inFlightRequests.clear();
  },
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
