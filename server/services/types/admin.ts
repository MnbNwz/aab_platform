import { UserRole, UserStatus, ApprovalStatus } from "@models/types/user";

// Interface for user filtering
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  approval?: ApprovalStatus;
  search?: string; // Email or phone search
  startDate?: Date;
  endDate?: Date;
}

// Interface for pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Interface for user update
export interface UserUpdateData {
  status?: UserStatus;
  approval?: ApprovalStatus;
}
