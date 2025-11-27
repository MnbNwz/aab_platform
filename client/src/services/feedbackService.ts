import { api } from "./apiService";
import type { User } from "../types";

// Feedback DTOs based on backend contract
export interface Feedback {
  _id: string;
  jobRequest: string;
  fromUser: User;
  toUser: string;
  fromRole: "customer" | "contractor";
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackWithJob extends Feedback {
  job: {
    _id: string;
    title: string;
    service: string;
    estimate: number;
    status: string;
  };
}

export interface CreateFeedbackRequest {
  jobRequestId: string;
  rating: number;
  comment?: string;
}

export interface PendingFeedbackJob extends Record<string, unknown> {
  _id: string;
  title: string;
  service: string;
  estimate: number;
  status: "completed";
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const feedbackApi = {
  createFeedback: async (payload: CreateFeedbackRequest): Promise<Feedback> => {
    const response = await api.post<Feedback>("/api/feedback", payload);
    return response.data!;
  },

  getUserFeedback: async (
    userId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FeedbackWithJob>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/feedback/user/${userId}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await api.get<FeedbackWithJob[]>(endpoint);

    // Construct the paginated response from ApiResponse structure
    const paginatedResponse: PaginatedResponse<FeedbackWithJob> = {
      data: response.data!,
      pagination: response.pagination!,
    };

    return paginatedResponse;
  },

  getPendingFeedbackJobs: async (
    params?: PaginationParams
  ): Promise<PaginatedResponse<PendingFeedbackJob>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/feedback/pending${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await api.get<PendingFeedbackJob[]>(endpoint);

    // Construct the paginated response from ApiResponse structure
    const paginatedResponse: PaginatedResponse<PendingFeedbackJob> = {
      data: response.data!,
      pagination: response.pagination!,
    };

    return paginatedResponse;
  },
} as const;
