// Membership-related type definitions
import { Document, Types } from "./mongoose";

export interface IMembershipPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  userType: "customer" | "contractor";
  tier: "basic" | "standard" | "premium";
  features: string[];
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  annualDiscountRate: number; // discount percentage for annual billing 15%
  duration: number; // in days
  stripeProductId?: string; // Stripe product ID
  stripePriceIdMonthly?: string; // Stripe price ID for monthly recurring
  stripePriceIdYearly?: string; // Stripe price ID for yearly recurring
  isActive: boolean;

  // Contractor-specific features
  leadsPerMonth?: number; // null for unlimited
  accessDelayHours?: number; // hours to wait before accessing new jobs
  radiusKm?: number; // null for unlimited
  featuredListing?: boolean; // top priority in listings
  offMarketAccess?: boolean; // access to off-market opportunities
  publicityReferences?: boolean; // publicity & references shown
  verifiedBadge?: boolean; // verified badge display
  financingSupport?: boolean; // financing support access
  privateNetwork?: boolean; // private network access (notary, lawyer, specialists, discounts)

  // Customer-specific features
  maxProperties?: number; // null for unlimited
  propertyType?: "domestic" | "commercial"; // property type access
  freeCalculators?: boolean; // free calculators access
  unlimitedRequests?: boolean; // unlimited service requests
  contractorReviewsVisible?: boolean; // contractor reviews visibility
  platformFeePercentage?: number; // platform fee percentage (0-100)
  priorityContractorAccess?: boolean; // priority access to top contractors
  propertyValuationSupport?: boolean; // property valuation support
  certifiedAASWork?: boolean; // certified AAS work adds resale value
  freeEvaluation?: boolean; // free evaluation by top specialists

  createdAt: Date;
  updatedAt: Date;
}

export interface IUpgradeHistoryEntry {
  fromPlanId: Types.ObjectId;
  toPlanId: Types.ObjectId;
  upgradedAt: Date;
  daysAdded: number;
  leadsAdded: number;
  amountPaid: number;
  paymentId: Types.ObjectId;
}

export interface IUserMembership extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  paymentId: Types.ObjectId;
  status: "active" | "expired" | "cancelled";
  billingPeriod: "monthly" | "yearly";
  startDate: Date;
  endDate: Date;
  isAutoRenew: boolean;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;

  // Lead tracking for contractors
  leadsUsedThisMonth?: number;
  leadsUsedThisYear?: number;
  lastLeadResetDate?: Date;

  // Upgrade tracking (removed extension)
  isUpgraded?: boolean;
  upgradedFromMembershipId?: Types.ObjectId;
  upgradedToMembershipId?: Types.ObjectId;
  upgradeHistory?: IUpgradeHistoryEntry[];

  // Accumulated values (for display and tracking)
  accumulatedLeads?: number; // Total leads available (from accumulation)
  bonusLeadsFromUpgrade?: number; // Extra leads from previous plan

  // ==== Snapshot fields (immutable per membership period) ====
  leadsPerMonthSnapshot?: number | null;
  periodMonthsSnapshot?: number; // 1 for monthly, 12 for yearly
  baseAllowance?: number | null; // leadsPerMonthSnapshot * periodMonthsSnapshot (null for unlimited)
  carryOverLeads?: number; // remaining leads carried from previous membership period
  totalLeadsAllowance?: number | null; // baseAllowance + carryOverLeads (null for unlimited)
  resetAnchorDate?: Date; // anchor for monthly reset calculations
  computedAt?: Date; // when the snapshot was computed

  // Selected plan benefit snapshots for consistency
  accessDelayHoursSnapshot?: number | null;
  radiusKmSnapshot?: number | null;
  featuredListingSnapshot?: boolean;
  offMarketAccessSnapshot?: boolean;

  // ==== EFFECTIVE BENEFIT SNAPSHOTS (Best of previous + new plan) ====
  // These are the ACTUAL benefits the user gets, accumulated from upgrades

  // Contractor Effective Benefits
  effectiveLeadsPerMonth?: number | null;
  effectiveAccessDelayHours?: number | null;
  effectiveRadiusKm?: number | null;
  effectiveFeaturedListing?: boolean;
  effectiveOffMarketAccess?: boolean;
  effectivePublicityReferences?: boolean;
  effectiveVerifiedBadge?: boolean;
  effectiveFinancingSupport?: boolean;
  effectivePrivateNetwork?: boolean;

  // Customer Effective Benefits
  effectiveMaxProperties?: number | null;
  effectivePropertyType?: "domestic" | "commercial";
  effectivePlatformFeePercentage?: number | null;
  effectiveFreeCalculators?: boolean;
  effectiveUnlimitedRequests?: boolean;
  effectiveContractorReviewsVisible?: boolean;
  effectivePriorityContractorAccess?: boolean;
  effectivePropertyValuationSupport?: boolean;
  effectiveCertifiedAASWork?: boolean;
  effectiveFreeEvaluation?: boolean;

  createdAt: Date;
  updatedAt: Date;
}
