// Payment-related types
import type { PaginationInfo } from "./index";

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
  status: "succeeded" | "pending" | "failed" | "cancelled" | "refunded";
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
  details?: {
    type: string;
    data?: Record<string, any>;
  } | null;
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
  status?: Payment["status"] | "refunded" | "all";
  startDate?: string;
  endDate?: string;
}

export interface PaymentState {
  history: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    } | null;
    loading: boolean;
    error: string | null;
  };
  detail: {
    payment: Payment | null;
    loading: boolean;
    error: string | null;
  };
}
