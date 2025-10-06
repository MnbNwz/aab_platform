import { UserRole, UserStatus, ApprovalStatus, Customer, Contractor } from "@models/types/user";

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

// Interface for user update (admin can update most fields)
export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  approval?: ApprovalStatus;
  profileImage?: string;
  geoHome?: {
    type: string;
    coordinates: [number, number];
  };
  customer?: Partial<Customer>;
  contractor?: Partial<Contractor>;
  stripeConnectAccountId?: string;
  stripeConnectStatus?: "pending" | "active" | "rejected" | "disabled";
  [key: string]: any; // Allow other fields for flexibility
}
