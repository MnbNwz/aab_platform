import type {
  ApiResponse,
  LoginCredentials,
  AuthResponse,
  User,
  UserStats,
  UsersResponse,
  UserFilters,
  UserUpdateData,
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
    console.log("📦 Sending FormData (multipart/form-data)");
  } else if (body && typeof body === "object" && !(body instanceof Blob)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
    if (body) {
      try {
        console.log(`📦 Request Body:`, JSON.parse(body as string));
      } catch {}
    }
  } else if (body) {
    headers["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    credentials: "include",
    headers,
    ...options,
    body,
  };

  console.log(`📡 API Request: ${options.method || "GET"} ${url}`);

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

    console.log("API Response: " + response.status + " " + response.statusText);
    console.log("Response Data:", data);

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
      throw createApiError("Request timeout Please refresh the page", 408);
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
    body: data instanceof FormData ? data : data ? data : undefined,
  });

const put = <T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> =>
  makeRequest<T>(endpoint, {
    method: "PUT",
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
    const response = await put<{ user: User }>(`/api/user/${userId}`, userData);
    return response.data.user;
  },
} as const;

// Services API
const servicesApi = {
  getServices: async (): Promise<{
    services: string[];
    version: number;
    lastUpdated: string;
  }> => {
    const response = await get<{
      services: string[];
      version: number;
      lastUpdated: string;
    }>("/api/services");
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
    return response.data.user;
  },

  // Revoke user (soft delete)
  revokeUser: async (userId: string): Promise<void> => {
    await del(`/api/admin/users/${userId}`);
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
