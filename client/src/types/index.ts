// User related types
export interface UserVerification {
  isVerified: boolean;
  message: string;
  otpCode: string | null;
  canResend: boolean;
  cooldownSeconds: number;
  otpExpiresInSeconds: number;
  otpSentAt?: string; // ISO timestamp when OTP was sent
  otpExpiresAt?: string; // ISO timestamp when OTP expires
  email?: string; // Email address for verification
  firstName?: string; // User's first name
}

export interface User {
  _id: string;
  id?: string; // For backward compatibility
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  status: UserStatus;
  approval: UserApproval;
  emailVerified: boolean; // Email verification status
  userVerification?: UserVerification; // OTP verification state
  isActive?: boolean; // For backward compatibility
  isVerified?: boolean; // For backward compatibility
  avatar?: string;
  geoHome?: {
    type: string;
    coordinates: [number, number];
  };
  customer?: {
    defaultPropertyType: string;
  };
  contractor?: {
    companyName: string;
    services: string[];
    license: string;
    taxId: string;
    docs: Array<{
      type: string;
      url: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "customer" | "contractor";
export type UserStatus = "pending" | "active" | "revoke";
export type UserApproval = "pending" | "approved" | "rejected";

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  geoHome: {
    type: string;
    coordinates: [number, number];
  };
  // Role-specific nested data
  customer?: {
    defaultPropertyType: string;
  };
  contractor?: {
    companyName: string;
    services: string[];
    license: string;
    taxId: string;
    docs: any[];
  };
}

export interface AuthResponse {
  user: User;
  message?: string;
}

// API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Pagination types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

// User management types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  revokedUsers: number;
  customers: number;
  contractors: number;
  admins: number;
}

export interface UsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  approval?: UserApproval;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserUpdateData {
  status?: UserStatus;
  approval?: UserApproval;
}

// Contractor Job Request types
export interface ContractorJob {
  _id: string;
  title: string;
  description: string;
  service: string;
  estimate: number;
  type: "regular" | "off_market";
  status: "open" | "in_progress" | "completed" | "cancelled";
  timeline: number;
  createdAt: string;
  accessTime: string;
  canAccessNow: boolean;
  distance: number;
  bidCount: number;
  createdBy: {
    _id: string;
    email: string;
    phone: string;
  };
  property: {
    _id: string;
    title: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  };
}

export interface MembershipInfo {
  tier: "basic" | "standard" | "premium";
  leadsPerMonth: number;
  accessDelayHours: number;
  radiusKm: number;
  featuredListing: boolean;
  offMarketAccess: boolean;
}

export interface LeadInfo {
  canAccess: boolean;
  leadsUsed: number;
  leadsLimit: number;
}

export interface ContractorJobAccessCheck {
  canAccess: boolean;
  accessTime?: string;
  leadsUsed?: number;
  leadsLimit?: number;
}

export interface ContractorJobsResponse {
  jobs: ContractorJob[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  membershipInfo: MembershipInfo;
  leadInfo: LeadInfo;
}

export interface ContractorJobFilters {
  page?: number;
  limit?: number;
  service?: string;
  search?: string;
}
