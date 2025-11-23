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

// User management pagination types (matches actual API response)
export interface UserManagementPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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
  pagination: UserManagementPaginationInfo;
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
  updatedAt: string;
  distance: number;
}

export interface ContractorBid {
  _id: string;
  jobRequest: string;
  contractor: string;
  bidAmount: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  timeline?: {
    startDate: string;
    endDate: string;
  };
  materials?: {
    included: boolean;
    description?: string;
  };
  warranty?: {
    period: number;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContractorJobDetails extends ContractorJob {
  paymentStatus: "pending" | "paid" | "refunded";
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  property?: {
    _id: string;
    userId: string;
    title: string;
    propertyType: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
    area: number;
    areaUnit: string;
    totalRooms: number;
    bedrooms: number;
    bathrooms: number;
    kitchens: number;
    description?: string;
    images?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  self: boolean;
  myBid: ContractorBid | null;
  selfBidAccepted: boolean;
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
  membershipInfo?: MembershipInfo; // Optional - backend no longer returns this
  leadInfo?: LeadInfo; // Optional - backend no longer returns this
}

export interface ContractorJobFilters {
  page?: number;
  limit?: number;
  service?: string;
  search?: string;
  status?: string;
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
  isUpgraded?: boolean;
  upgradedFromMembershipId?: string;
  upgradedToMembershipId?: string;
  upgradeHistory?: Array<{
    fromPlanId: string;
    toPlanId: string;
    upgradedAt: string;
    daysAdded: number;
    leadsAdded: number;
    amountPaid: number;
    paymentId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Membership checkout payload
export interface MembershipCheckoutPayload {
  planId: string;
  billingPeriod: "monthly" | "yearly";
  url: string;
  isAutoRenew?: boolean;
}

// Checkout response
export interface CheckoutResponse {
  success: boolean;
  url: string;
}

// Investment Opportunity Types
export type InvestmentPropertyType =
  | "house"
  | "duplex"
  | "triplex"
  | "sixplex"
  | "land"
  | "commercial";
export type InvestmentStatus = "available" | "under_offer" | "sold";
export type ContactStatus = "pending" | "accepted" | "rejected";

export interface InvestmentLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  city?: string;
  province?: string;
  fullAddress?: string;
}

export interface InvestmentPhoto {
  url: string;
  caption?: string;
}

export interface InvestmentDocument {
  url: string;
  name: string;
  type: string;
}

export interface InvestmentInterest {
  contractorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
    contractor?: {
      companyName?: string;
      license?: string;
      services?: string[];
      taxId?: string;
    };
  };
  expressedAt: string;
  message?: string;
  adminNotes?: string;
  contactStatus: ContactStatus;
}

export interface InvestmentOpportunity {
  _id: string;
  title: string;
  propertyType: InvestmentPropertyType;
  location: InvestmentLocation;
  askingPrice: number; // in cents
  projectedROI?: number;
  description: string;
  lotSize?: string;
  buildingSize?: string;
  numberOfUnits?: number;
  yearBuilt?: number;
  renovationNeeded?: boolean;
  estimatedRenovationCost?: number;
  estimatedCompletionTime?: number;
  renovationDetails?: string;
  highlights?: string[];
  photos?: InvestmentPhoto[];
  documents?: InvestmentDocument[];
  status: InvestmentStatus;
  interests: InvestmentInterest[];
  interestCount?: number;
  totalRenovationCost?: number;
  totalInvestment?: number;
  hasExpressedInterest?: boolean; // Whether the current user has expressed interest
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentOpportunityFilters {
  page?: number;
  limit?: number;
  status?: InvestmentStatus;
  propertyType?: InvestmentPropertyType;
  province?: string;
  maxPrice?: number;
  minROI?: number;
  maxROI?: number;
  renovationNeeded?: boolean;
  search?: string;
}

export interface InvestmentOpportunitiesResponse {
  success: boolean;
  data: InvestmentOpportunity[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface ContractorInvestmentInterest {
  opportunityId: string;
  title: string;
  propertyType: InvestmentPropertyType;
  location: InvestmentLocation;
  askingPrice: number;
  projectedROI?: number;
  totalInvestment?: number;
  status: InvestmentStatus;
  photos?: InvestmentPhoto[];
  interest: {
    expressedAt: string;
    message?: string;
    contactStatus: ContactStatus;
  };
}

export interface InvestmentStatistics {
  statusBreakdown: Array<{
    _id: InvestmentStatus;
    count: number;
    totalValue: number;
    avgROI: number;
  }>;
  propertyTypeBreakdown: Array<{
    _id: InvestmentPropertyType;
    count: number;
    avgPrice: number;
  }>;
  provinceBreakdown: Array<{
    _id: string;
    count: number;
    avgPrice: number;
  }>;
  overallStats: Array<{
    _id: null;
    totalOpportunities: number;
    totalValue: number;
    avgPrice: number;
    avgROI: number;
    totalInterests: number;
  }>;
  recentOpportunities: Array<{
    _id: string;
    title: string;
    askingPrice: number;
    status: InvestmentStatus;
    interestCount: number;
    createdAt: string;
  }>;
}

// Payment types
export type PaymentType = "bid_acceptance" | "job_completion";

export interface JobPaymentCheckoutRequest {
  bidId: string;
  paymentType: PaymentType;
  successUrl: string;
  cancelUrl: string;
}

export interface JobPaymentCheckoutResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
  amount: number;
  paymentType: PaymentType;
  message?: string;
}

export interface JobPaymentCheckoutError {
  success: false;
  message: string;
}

export interface JobCompletionPaymentRequest {
  bidId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface JobCompletionPaymentResponse {
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
  amount: number;
  paymentType: "job_completion";
}

// Re-export all types from centralized type files
export * from "./component";
export * from "./job";
export * from "./property";
export * from "./payment";
export * from "./service";
export * from "./geocoding";
export * from "./api";
export * from "./dashboard";
export * from "./bid";
