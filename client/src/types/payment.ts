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
  userId?: string | null;
  email?: string | null;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "cancelled" | "refunded";
  type?: "job" | "membership" | string;
  purpose?: string | null;
  failureReason?: string | null;
  billingPeriod?: "monthly" | "yearly";
  metadata?: Record<string, any> | null;
  stripeCustomerId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  planId?: string | null;
  createdAt: string;
  updatedAt?: string;
  membership?: PaymentMembership | null;
  jobDetails?: PaymentJobDetails | null;
  details?: PaymentDetailInfo | null;
}

export interface PaymentJobSummary {
  title: string;
  service: string;
  status: string;
  referenceNumber?: string | null;
}

export interface PaymentJobParticipants {
  contractor?: {
    id?: string;
    name?: string;
    companyName?: string | null;
  } | null;
  customer?: {
    id?: string;
    name?: string;
  } | null;
}

export interface PaymentJobDetailData {
  jobId?: string;
  jobSummary?: PaymentJobSummary | null;
  participants?: PaymentJobParticipants | null;
}

export interface PaymentMembershipDetailData {
  planName?: string;
  planTier?: string;
  status?: string;
  cycleStart?: string;
  cycleEnd?: string;
  renewalDate?: string;
  billingPeriod?: string;
  isAutoRenew?: boolean;
}

export type PaymentDetailInfo =
  | {
      type: "job";
      data?: PaymentJobDetailData | null;
    }
  | {
      type: "membership";
      data?: PaymentMembershipDetailData | null;
    }
  | {
      type: string;
      data?: Record<string, any>;
    };

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
