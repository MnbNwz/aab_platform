export interface UserVerification {
  isVerified: boolean;
  message: string;
  canResend: boolean;
  cooldownSeconds: number;
  otpExpiresInSeconds: number;
  otpSentAt?: string;
  otpExpiresAt?: string;
  email?: string;
  firstName?: string;
}

export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  status: UserStatus;
  approval: UserApproval;
  emailVerified: boolean;
  userVerification?: UserVerification;
  isActive?: boolean;
  isVerified?: boolean;
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
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
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
  tier: MembershipPlanTier;
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

// Membership Plan types
export type MembershipPlanTier = "basic" | "standard" | "premium";
export type MembershipPlanUserType = "customer" | "contractor";

// Base membership plan interface with common fields
export interface BaseMembershipPlan {
  _id: string;
  name: string;
  description: string;
  userType: MembershipPlanUserType;
  tier: MembershipPlanTier;
  features: string[];
  monthlyPrice: number; // Price in cents
  yearlyPrice: number; // Price in cents
  annualDiscountRate: number; // Percentage discount for yearly billing
  duration: number; // Duration in days
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  stripePriceIdOneTimeMonthly: string;
  stripePriceIdOneTimeYearly: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer-specific plan features
export interface CustomerPlanFeatures {
  maxProperties: number;
  propertyType: string;
  freeCalculators: boolean;
  unlimitedRequests: boolean;
  contractorReviewsVisible: boolean;
  platformFeePercentage: number; // Percentage (e.g., 100 = 100%)
  priorityContractorAccess: boolean;
  propertyValuationSupport: boolean;
  certifiedAASWork: boolean;
  freeEvaluation: boolean;
}

// Contractor-specific plan features
export interface ContractorPlanFeatures {
  leadsPerMonth: number;
  accessDelayHours: number;
  radiusKm: number;
  featuredListing: boolean;
  offMarketAccess: boolean;
  publicityReferences: boolean;
  verifiedBadge: boolean;
  financingSupport: boolean;
  privateNetwork: boolean;
}

// Complete membership plan interfaces
export interface CustomerMembershipPlan
  extends BaseMembershipPlan,
    CustomerPlanFeatures {
  userType: "customer";
}

export interface ContractorMembershipPlan
  extends BaseMembershipPlan,
    ContractorPlanFeatures {
  userType: "contractor";
}

// Union type for all membership plans
export type MembershipPlan = CustomerMembershipPlan | ContractorMembershipPlan;

// Membership plan response
export interface MembershipPlansResponse {
  success: boolean;
  data: MembershipPlan[];
}

// Current membership info
export interface CurrentMembership {
  _id: string;
  userId: string;
  planId: {
    _id: string;
    name: string;
    tier: MembershipPlanTier;
    price: {
      monthly: number;
      yearly: number;
    };
    features: string[];
    stripePriceIdMonthly: string;
    stripePriceIdYearly: string;
  };
  paymentId: string;
  status: "active" | "inactive" | "cancelled" | "expired";
  billingPeriod: "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  isAutoRenew: boolean;
  stripeSubscriptionId: string | null;
  leadsUsedThisMonth: number;
  lastLeadResetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Membership checkout payload
export interface MembershipCheckoutPayload {
  planId: string;
  billingPeriod: "monthly" | "yearly";
  url: string;
}

// Checkout response
export interface CheckoutResponse {
  success: boolean;
  url: string;
}
