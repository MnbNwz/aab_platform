import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IMembershipPlan } from "@models/types/membership";
import {
  USER_TYPES,
  MEMBERSHIP_TIERS,
  DEFAULT_ANNUAL_DISCOUNT_RATE,
  DEFAULT_MEMBERSHIP_DURATION_DAYS,
} from "@models/constants";

// Re-export the interface
export { IMembershipPlan };

const MembershipPlanSchema: Schema<IMembershipPlan> = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  userType: {
    type: String,
    enum: USER_TYPES,
    required: true,
  },
  tier: {
    type: String,
    enum: MEMBERSHIP_TIERS,
    required: true,
  },
  features: [{ type: String }],
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
  annualDiscountRate: { type: Number, default: DEFAULT_ANNUAL_DISCOUNT_RATE }, // 15% discount
  duration: { type: Number, required: true, default: DEFAULT_MEMBERSHIP_DURATION_DAYS }, // 30 days default
  stripeProductId: { type: String },
  stripePriceIdMonthly: { type: String },
  stripePriceIdYearly: { type: String },
  isActive: { type: Boolean, default: true },

  // Contractor-specific features
  leadsPerMonth: { type: Number, default: null }, // null for unlimited
  accessDelayHours: { type: Number, default: 24 }, // hours to wait before accessing new jobs
  radiusKm: { type: Number, default: null }, // null for unlimited
  featuredListing: { type: Boolean, default: false }, // top priority in listings
  offMarketAccess: { type: Boolean, default: false }, // access to off-market opportunities
  publicityReferences: { type: Boolean, default: false }, // publicity & references shown
  verifiedBadge: { type: Boolean, default: false }, // verified badge display
  financingSupport: { type: Boolean, default: false }, // financing support access
  privateNetwork: { type: Boolean, default: false }, // private network access

  // Customer-specific features
  maxProperties: { type: Number, default: null }, // null for unlimited
  propertyType: {
    type: String,
    enum: ["domestic", "commercial"],
    default: "domestic",
  },
  freeCalculators: { type: Boolean, default: false }, // free calculators access
  unlimitedRequests: { type: Boolean, default: false }, // unlimited service requests
  contractorReviewsVisible: { type: Boolean, default: false }, // contractor reviews visibility
  platformFeePercentage: { type: Number, default: 100 }, // platform fee percentage (0-100)
  priorityContractorAccess: { type: Boolean, default: false }, // priority access to top contractors
  propertyValuationSupport: { type: Boolean, default: false }, // property valuation support
  certifiedAASWork: { type: Boolean, default: false }, // certified AAS work adds resale value
  freeEvaluation: { type: Boolean, default: false }, // free evaluation by top specialists
});

// Create indexes for better query performance
MembershipPlanSchema.index({ isActive: 1 }); // For getAllPlans() - most common query

export const MembershipPlan = createModel<IMembershipPlan>({
  schema: MembershipPlanSchema,
  modelName: "MembershipPlan",
});
