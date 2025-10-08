import { MembershipPlan, IMembershipPlan } from "@models/membership";
import { UserMembership, IUserMembership } from "@models/user";
import { Types } from "@models/types";
import { getCurrentMembership } from "./membership";

// Tier hierarchy for validation
const TIER_HIERARCHY = {
  basic: 1,
  standard: 2,
  premium: 3,
};

/**
 * Calculate days remaining from a date
 */
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if new plan is an upgrade (higher tier)
 */
export function isUpgrade(currentTier: string, newTier: string): boolean {
  return (
    TIER_HIERARCHY[newTier as keyof typeof TIER_HIERARCHY] >
    TIER_HIERARCHY[currentTier as keyof typeof TIER_HIERARCHY]
  );
}

/**
 * Validate upgrade eligibility with optimized single pipeline query
 */
export async function validateUpgrade(
  userId: string,
  newPlanId: string,
): Promise<{
  currentMembership: IUserMembership;
  currentPlan: IMembershipPlan;
  newPlan: IMembershipPlan;
}> {
  // Single aggregation pipeline to fetch everything at once
  const result = await UserMembership.aggregate([
    // Match active membership for user
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: "active",
        endDate: { $gt: new Date() },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 1 },
    // Lookup current plan
    {
      $lookup: {
        from: "membershipplans",
        localField: "planId",
        foreignField: "_id",
        as: "currentPlan",
      },
    },
    { $unwind: "$currentPlan" },
    // Lookup new plan
    {
      $lookup: {
        from: "membershipplans",
        let: { newPlanId: new Types.ObjectId(newPlanId) },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$newPlanId"] }, isActive: true } }],
        as: "newPlan",
      },
    },
    { $unwind: { path: "$newPlan", preserveNullAndEmptyArrays: false } },
    // Validate in pipeline
    {
      $project: {
        membership: "$$ROOT",
        currentPlan: "$currentPlan",
        newPlan: "$newPlan",
        validations: {
          sameUserType: { $eq: ["$currentPlan.userType", "$newPlan.userType"] },
          currentTierValue: {
            $switch: {
              branches: [
                { case: { $eq: ["$currentPlan.tier", "basic"] }, then: 1 },
                { case: { $eq: ["$currentPlan.tier", "standard"] }, then: 2 },
                { case: { $eq: ["$currentPlan.tier", "premium"] }, then: 3 },
              ],
              default: 0,
            },
          },
          newTierValue: {
            $switch: {
              branches: [
                { case: { $eq: ["$newPlan.tier", "basic"] }, then: 1 },
                { case: { $eq: ["$newPlan.tier", "standard"] }, then: 2 },
                { case: { $eq: ["$newPlan.tier", "premium"] }, then: 3 },
              ],
              default: 0,
            },
          },
        },
      },
    },
    {
      $addFields: {
        "validations.isUpgrade": {
          $gt: ["$validations.newTierValue", "$validations.currentTierValue"],
        },
      },
    },
  ]);

  if (!result || result.length === 0) {
    throw new Error("No active membership found or new plan not available");
  }

  const data = result[0];

  // Validate user type match
  if (!data.validations.sameUserType) {
    throw new Error("Cannot change user type during upgrade. Must remain customer or contractor.");
  }

  // Validate it's an upgrade (higher tier)
  if (!data.validations.isUpgrade) {
    throw new Error(
      `Can only upgrade to higher tier. Current: ${data.currentPlan.tier}, New: ${data.newPlan.tier}. Downgrades are not allowed.`,
    );
  }

  // Remove validation fields from membership
  delete data.membership.currentPlan;
  delete data.membership.newPlan;

  return {
    currentMembership: data.membership,
    currentPlan: data.currentPlan,
    newPlan: data.newPlan,
  };
}

/**
 * Calculate accumulated values when upgrading
 */
export function calculateUpgradeValues(
  currentMembership: IUserMembership,
  currentPlan: IMembershipPlan,
  newPlan: IMembershipPlan,
) {
  const now = new Date();
  const remainingDays = getDaysRemaining(currentMembership.endDate);

  // Calculate new plan duration based on billing period
  const newPlanDuration = currentMembership.billingPeriod === "monthly" ? 30 : 365;

  // 1. DAYS - ADD remaining + new
  const accumulatedDays = remainingDays + newPlanDuration;
  const newEndDate = addDays(now, accumulatedDays);

  // 2. LEADS - ADD remaining + new allocation (for contractors)
  let accumulatedLeads = 0;
  let bonusLeads = 0;
  let newLeadsPerMonth = 0;

  if (currentPlan.userType === "contractor") {
    // Calculate remaining leads from current plan
    const currentLeadsLimit = currentPlan.leadsPerMonth || 0;
    const usedLeads = currentMembership.leadsUsedThisMonth || 0;
    bonusLeads = Math.max(0, currentLeadsLimit - usedLeads);

    // New plan allocation
    newLeadsPerMonth = newPlan.leadsPerMonth || 0;

    // Total accumulated leads
    accumulatedLeads = bonusLeads + newLeadsPerMonth;
  }

  // 3. RADIUS - MAX (highest value, null = unlimited wins)
  let effectiveRadius: number | null;
  if (currentPlan.radiusKm === null || newPlan.radiusKm === null) {
    effectiveRadius = null; // Unlimited wins
  } else {
    effectiveRadius = Math.max(currentPlan.radiusKm || 0, newPlan.radiusKm || 0);
  }

  // 4. ACCESS DELAY - MIN (lower is better for contractor)
  let effectiveAccessDelay = 0;
  if (currentPlan.userType === "contractor") {
    effectiveAccessDelay = Math.min(
      currentPlan.accessDelayHours || 0,
      newPlan.accessDelayHours || 0,
    );
  }

  // 5. MAX PROPERTIES - MAX (higher is better for customer)
  let effectiveMaxProperties: number | null = null;
  if (currentPlan.userType === "customer") {
    if (currentPlan.maxProperties === null || newPlan.maxProperties === null) {
      effectiveMaxProperties = null; // Unlimited wins
    } else {
      effectiveMaxProperties = Math.max(currentPlan.maxProperties || 0, newPlan.maxProperties || 0);
    }
  }

  // 6. PLATFORM FEE - MIN (lower is better for customer)
  let effectivePlatformFee = 0;
  if (currentPlan.userType === "customer") {
    effectivePlatformFee = Math.min(
      currentPlan.platformFeePercentage || 0,
      newPlan.platformFeePercentage || 0,
    );
  }

  // 7. BOOLEAN FEATURES - OR (true wins)
  const effectiveFeatures = {
    // Contractor features
    featuredListing: currentPlan.featuredListing || newPlan.featuredListing || false,
    offMarketAccess: currentPlan.offMarketAccess || newPlan.offMarketAccess || false,
    publicityReferences: currentPlan.publicityReferences || newPlan.publicityReferences || false,
    verifiedBadge: currentPlan.verifiedBadge || newPlan.verifiedBadge || false,
    financingSupport: currentPlan.financingSupport || newPlan.financingSupport || false,
    privateNetwork: currentPlan.privateNetwork || newPlan.privateNetwork || false,

    // Customer features
    freeCalculators: currentPlan.freeCalculators || newPlan.freeCalculators || false,
    unlimitedRequests: currentPlan.unlimitedRequests || newPlan.unlimitedRequests || false,
    contractorReviewsVisible:
      currentPlan.contractorReviewsVisible || newPlan.contractorReviewsVisible || false,
    priorityContractorAccess:
      currentPlan.priorityContractorAccess || newPlan.priorityContractorAccess || false,
    propertyValuationSupport:
      currentPlan.propertyValuationSupport || newPlan.propertyValuationSupport || false,
    certifiedAASWork: currentPlan.certifiedAASWork || newPlan.certifiedAASWork || false,
    freeEvaluation: currentPlan.freeEvaluation || newPlan.freeEvaluation || false,
  };

  // 8. Property Type - Use the higher access level
  let effectivePropertyType: "domestic" | "commercial" = "domestic";
  if (currentPlan.propertyType === "commercial" || newPlan.propertyType === "commercial") {
    effectivePropertyType = "commercial";
  }

  return {
    accumulatedDays,
    newEndDate,
    accumulatedLeads,
    bonusLeads,
    newLeadsPerMonth,
    effectiveRadius,
    effectiveAccessDelay,
    effectiveMaxProperties,
    effectivePlatformFee,
    effectivePropertyType,
    effectiveFeatures,
    remainingDays,
    newPlanDuration,
  };
}

/**
 * Get the payment amount for upgrade (full price of new plan)
 */
export function getUpgradePaymentAmount(
  newPlan: IMembershipPlan,
  billingPeriod: "monthly" | "yearly",
): number {
  if (billingPeriod === "monthly") {
    return newPlan.monthlyPrice;
  } else {
    // Apply annual discount
    const discountedPrice = Math.round(
      newPlan.yearlyPrice * (1 - newPlan.annualDiscountRate / 100),
    );
    return discountedPrice;
  }
}
