import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IUserMembership } from "@models/types/membership";
import { MEMBERSHIP_STATUSES, BILLING_PERIODS } from "@models/constants";

// Re-export the interface
export { IUserMembership };

const UpgradeHistoryEntrySchema = new Schema(
  {
    fromPlanId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    toPlanId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    upgradedAt: { type: Date, required: true },
    daysAdded: { type: Number, required: true },
    leadsAdded: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
  },
  { _id: false },
);

const UserMembershipSchema: Schema<IUserMembership> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: "active",
    },
    billingPeriod: {
      type: String,
      enum: BILLING_PERIODS,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isAutoRenew: { type: Boolean, default: false }, // Toggled by user in settings
    stripeSubscriptionId: { type: String }, // For recurring subscriptions

    // Lead tracking for contractors
    leadsUsedThisMonth: { type: Number, default: 0 }, // for monthly billing - leads used this month
    leadsUsedThisYear: { type: Number, default: 0 }, // for yearly billing - leads used this year
    lastLeadResetDate: { type: Date, default: Date.now }, // when leads were last reset

    // Upgrade tracking
    isUpgraded: { type: Boolean, default: false }, // True if this membership was created via upgrade
    upgradedFromMembershipId: { type: Schema.Types.ObjectId, ref: "UserMembership" }, // Reference to previous membership
    upgradedToMembershipId: { type: Schema.Types.ObjectId, ref: "UserMembership" }, // Reference to new membership (if this was upgraded)
    upgradeHistory: { type: [UpgradeHistoryEntrySchema], default: [] }, // Track all upgrades in this membership

    // Accumulated values (for display and tracking)
    accumulatedLeads: { type: Number }, // Total leads available (from accumulation)
    bonusLeadsFromUpgrade: { type: Number }, // Extra leads from previous plan

    // ==== EFFECTIVE BENEFIT SNAPSHOTS (Best of previous + new plan) ====
    // These are the ACTUAL benefits the user gets, accumulated from upgrades

    // Contractor Effective Benefits
    effectiveLeadsPerMonth: { type: Number, default: null }, // Base leads per month (null = unlimited)
    effectiveAccessDelayHours: { type: Number, default: null }, // Best access delay (lower is better)
    effectiveRadiusKm: { type: Number, default: null }, // Best radius (higher is better, null = unlimited)
    effectiveFeaturedListing: { type: Boolean, default: false },
    effectiveOffMarketAccess: { type: Boolean, default: false },
    effectivePublicityReferences: { type: Boolean, default: false },
    effectiveVerifiedBadge: { type: Boolean, default: false },
    effectiveFinancingSupport: { type: Boolean, default: false },
    effectivePrivateNetwork: { type: Boolean, default: false },

    // Customer Effective Benefits
    effectiveMaxProperties: { type: Number, default: null }, // Max properties (null = unlimited)
    effectivePropertyType: {
      type: String,
      enum: ["domestic", "commercial"],
      default: "domestic",
    },
    effectivePlatformFeePercentage: { type: Number, default: null }, // Platform fee (lower is better)
    effectiveFreeCalculators: { type: Boolean, default: false },
    effectiveUnlimitedRequests: { type: Boolean, default: false },
    effectiveContractorReviewsVisible: { type: Boolean, default: false },
    effectivePriorityContractorAccess: { type: Boolean, default: false },
    effectivePropertyValuationSupport: { type: Boolean, default: false },
    effectiveCertifiedAASWork: { type: Boolean, default: false },
    effectiveFreeEvaluation: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index to quickly find active memberships
UserMembershipSchema.index({ userId: 1, status: 1 });
UserMembershipSchema.index({ endDate: 1, status: 1 });
UserMembershipSchema.index({ userId: 1, status: 1, endDate: 1 });

export const UserMembership = createModel<IUserMembership>({
  schema: UserMembershipSchema,
  modelName: "UserMembership",
});
