import { api } from "./apiService";

// Feedback DTOs based on backend contract
export interface Feedback {
  _id: string;
  jobRequest: string;
  fromUser: string;
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

export const feedbackApi = {
  createFeedback: async (payload: CreateFeedbackRequest): Promise<Feedback> => {
    const response = await api.post<Feedback>("/api/feedback", payload);
    return response.data!;
  },

  getUserFeedback: async (userId: string): Promise<FeedbackWithJob[]> => {
    const response = await api.get<FeedbackWithJob[]>(
      `/api/feedback/user/${userId}`
    );
    return response.data!;
  },

  getPendingFeedbackJobs: async (): Promise<PendingFeedbackJob[]> => {
    const response = await api.get<PendingFeedbackJob[]>(
      "/api/feedback/pending"
    );
    return response.data!;
  },
} as const;
