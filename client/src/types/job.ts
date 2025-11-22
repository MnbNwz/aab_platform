// Job-related types
import type { PropertyFormData, PropertyInJob } from "./property";
import type { Bid } from "./bid";

// Re-export commonly used types
export type { Bid, PropertyInJob };

// Job Entities
export interface CreatedBy {
  _id: string;
  email: string;
  phone?: string;
}

export interface Job {
  _id: string;
  createdBy: string | CreatedBy;
  property?: string | import("./property").PropertyInJob;
  title: string;
  description: string;
  category: string;
  service: string;
  estimate: number;
  type: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  bids: Bid[];
  bidCount?: number;
  acceptedBid: string | null;
  paymentStatus: "pending" | "paid" | "refunded";
  timeline: number; // Changed from array to number (days count)
  createdAt: string;
  updatedAt: string;
}

export interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  createError: string | null;
  updateLoading: boolean;
  cancelLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    totalCount: number;
    itemsPerPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string;
    status: string;
    service: string;
    type: string;
    category: string;
    sortBy: string;
    sortOrder: string;
    page: number;
    limit: number;
  };
}

// Job Component Props
export interface JobViewEditModalProps {
  isOpen: boolean;
  onClose: (wasSaved?: boolean) => void;
  job: Job;
  properties?: PropertyFormData[];
}

export interface JobDetailViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onRefreshJobs: () => void;
  onEditJob?: () => void;
  shouldRefetch?: boolean;
}

// Job Form Types
export interface JobFormInputs {
  title: string;
  description: string;
  category: string;
  estimate: string;
  property: string;
  timeline: string;
  status?: "open" | "in_progress" | "completed" | "cancelled";
}

export interface JobUpdateData {
  title: string;
  description: string;
  service: string;
  type: string;
  createdBy: string;
  status?: string;
  estimate?: number;
  property?: string;
  timeline?: number;
}

// Confirm Modal Types
export type ConfirmModalType = "save" | "cancel" | "close";

export interface ConfirmModalState {
  open: boolean;
  type: ConfirmModalType | null;
  message: string;
  title: string;
  confirmText: string;
}
