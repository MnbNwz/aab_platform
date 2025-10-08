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
  status: "active" | "expired" | "cancelled" | "upgraded";
  billingPeriod: "monthly" | "yearly"; // Which billing option user chose
  startDate: Date;
  endDate: Date;
  isAutoRenew: boolean;
  stripeSubscriptionId?: string; // For recurring subscriptions
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;

  // Lead tracking for contractors
  leadsUsedThisMonth?: number; // for monthly billing - leads used this month
  leadsUsedThisYear?: number; // for yearly billing - leads used this year
  lastLeadResetDate?: Date; // when leads were last reset

  // Upgrade tracking
  isUpgraded?: boolean; // True if this membership was created via upgrade
  upgradedFromMembershipId?: Types.ObjectId; // Reference to previous membership
  upgradedToMembershipId?: Types.ObjectId; // Reference to new membership (if this was upgraded)
  upgradeHistory?: IUpgradeHistoryEntry[]; // Track all upgrades in this membership

  // Accumulated values (for display and tracking)
  accumulatedLeads?: number; // Total leads available (from accumulation)
  bonusLeadsFromUpgrade?: number; // Extra leads from previous plan

  createdAt: Date;
  updatedAt: Date;
}
