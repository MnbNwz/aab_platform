import { IMembershipPlan } from "@models/membership";
import { UserMembership, IUserMembership } from "@models/user";
import { Types } from "@models/types";

// Tier hierarchy for reference (not used for validation anymore)
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
 * Check if new plan is an upgrade (higher tier) - for reference only
 */
export function isUpgrade(currentTier: string, newTier: string): boolean {
  return (
    TIER_HIERARCHY[newTier as keyof typeof TIER_HIERARCHY] >
    TIER_HIERARCHY[currentTier as keyof typeof TIER_HIERARCHY]
  );
}

/**
 * Helper: Get maximum value, treating null as unlimited (always wins)
 */
function maxWithNull(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a === null || a === undefined) return null; // Unlimited
  if (b === null || b === undefined) return null; // Unlimited
  return Math.max(a, b);
}

/**
 * Validate upgrade eligibility - UPDATED to allow same tier upgrades
 * Now validates: same userType only
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

  // CRITICAL: Restrict multiple upgrades - user must let current membership expire first
  const hasUpgradeHistory =
    data.membership.upgradeHistory && data.membership.upgradeHistory.length > 0;
  const isUpgraded = data.membership.isUpgraded || false;

  if (hasUpgradeHistory || isUpgraded) {
    const membershipEndDate = new Date(data.membership.endDate);
    const currentDate = new Date();
    const daysRemaining = Math.ceil(
      (membershipEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    throw new Error(
      `Multiple upgrades not allowed. Your current membership expires on ${membershipEndDate.toLocaleDateString()} (${daysRemaining} days remaining). Please wait for your current membership to expire before upgrading again.`,
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
 * Calculate effective benefits when upgrading
 * This applies the "best of both" logic for all benefits
 */
export function calculateEffectiveBenefits(
  currentMembership: IUserMembership,
  currentPlan: IMembershipPlan,
  newPlan: IMembershipPlan,
  billingPeriod: "monthly" | "yearly",
) {
  const remainingDays = getDaysRemaining(currentMembership.endDate);

  // Calculate new plan duration based on billing period
  const newPlanDuration = billingPeriod === "monthly" ? 30 : 365;

  // 1. DAYS - ADD remaining + new
  const accumulatedDays = remainingDays + newPlanDuration;
  // CRITICAL FIX: Calculate endDate from ORIGINAL startDate, not current time
  // This ensures the membership period is continuous from the original purchase date
  const newEndDate = addDays(currentMembership.startDate, accumulatedDays);

  // 2. LEADS - Calculate remaining and accumulate (for contractors)
  let accumulatedLeads = 0;
  let bonusLeads = 0;
  let effectiveLeadsPerMonth = newPlan.leadsPerMonth ?? null;

  if (currentPlan.userType === "contractor") {
    // CRITICAL FIX: Preserve existing accumulated leads from previous upgrades
    const existingAccumulatedLeads = currentMembership.accumulatedLeads || 0;

    // CRITICAL FIX: For upgrades, use accumulated leads if available, otherwise use monthly limit
    const currentLeadsLimit =
      existingAccumulatedLeads > 0
        ? existingAccumulatedLeads // Use accumulated leads from previous upgrades
        : (currentMembership.effectiveLeadsPerMonth ?? currentPlan.leadsPerMonth ?? 0); // Fallback to monthly limit

    // Calculate remaining leads from CURRENT membership
    // Use the appropriate counter based on current billing period
    const currentBillingPeriod = currentMembership.billingPeriod;
    const usedLeads =
      currentBillingPeriod === "yearly"
        ? currentMembership.leadsUsedThisYear || 0
        : currentMembership.leadsUsedThisMonth || 0;

    bonusLeads = Math.max(0, currentLeadsLimit - usedLeads);

    // If current or new has unlimited (null), keep unlimited
    if (currentMembership.effectiveLeadsPerMonth === null || newPlan.leadsPerMonth === null) {
      effectiveLeadsPerMonth = null;
      accumulatedLeads = 0; // N/A for unlimited
    } else {
      // Calculate new plan's TOTAL lead allocation based on NEW billing period
      const newLeadsPerMonthBase = newPlan.leadsPerMonth || 0;
      const newPlanTotalLeads =
        billingPeriod === "yearly"
          ? newLeadsPerMonthBase * 12 // Yearly: multiply by 12 months
          : newLeadsPerMonthBase; // Monthly: just the monthly amount

      // New plan allocation (base leads per month stays the same)
      effectiveLeadsPerMonth = newPlan.leadsPerMonth;

      // CRITICAL FIX: Accumulated leads = existing + bonus from previous + NEW plan's total allocation
      accumulatedLeads = existingAccumulatedLeads + bonusLeads + newPlanTotalLeads;
    }
  }

  // 3. CONTRACTOR BENEFITS - Best of both
  let effectiveAccessDelayHours = newPlan.accessDelayHours ?? 24;
  let effectiveRadiusKm = newPlan.radiusKm ?? null;

  if (currentPlan.userType === "contractor") {
    // Access Delay - MIN (lower is better for contractor)
    const currentDelay =
      currentMembership.effectiveAccessDelayHours ?? currentPlan.accessDelayHours ?? 24;
    const newDelay = newPlan.accessDelayHours ?? 24;
    effectiveAccessDelayHours = Math.min(currentDelay, newDelay);

    // Radius - MAX (higher is better, null = unlimited wins)
    const currentRadius = currentMembership.effectiveRadiusKm ?? currentPlan.radiusKm;
    effectiveRadiusKm = maxWithNull(currentRadius, newPlan.radiusKm);
  }

  // 4. CUSTOMER BENEFITS - Best of both
  let effectiveMaxProperties: number | null = null;
  let effectivePlatformFeePercentage = 100;
  let effectivePropertyType: "domestic" | "commercial" = "domestic";

  if (currentPlan.userType === "customer") {
    // Max Properties - MAX (higher is better, null = unlimited wins)
    const currentMaxProps = currentMembership.effectiveMaxProperties ?? currentPlan.maxProperties;
    effectiveMaxProperties = maxWithNull(currentMaxProps, newPlan.maxProperties);

    // Platform Fee - MIN (lower is better for customer)
    const currentFee =
      currentMembership.effectivePlatformFeePercentage ?? currentPlan.platformFeePercentage ?? 100;
    const newFee = newPlan.platformFeePercentage ?? 100;
    effectivePlatformFeePercentage = Math.min(currentFee, newFee);

    // Property Type - Commercial wins over Domestic
    const currentType =
      currentMembership.effectivePropertyType ?? currentPlan.propertyType ?? "domestic";
    const newType = newPlan.propertyType ?? "domestic";
    effectivePropertyType =
      currentType === "commercial" || newType === "commercial" ? "commercial" : "domestic";
  }

  // 5. BOOLEAN FEATURES - OR (true wins)
  const effectiveFeatures = {
    // Contractor features
    featuredListing:
      (currentMembership.effectiveFeaturedListing ?? currentPlan.featuredListing ?? false) ||
      (newPlan.featuredListing ?? false),
    offMarketAccess:
      (currentMembership.effectiveOffMarketAccess ?? currentPlan.offMarketAccess ?? false) ||
      (newPlan.offMarketAccess ?? false),
    publicityReferences:
      (currentMembership.effectivePublicityReferences ??
        currentPlan.publicityReferences ??
        false) ||
      (newPlan.publicityReferences ?? false),
    verifiedBadge:
      (currentMembership.effectiveVerifiedBadge ?? currentPlan.verifiedBadge ?? false) ||
      (newPlan.verifiedBadge ?? false),
    financingSupport:
      (currentMembership.effectiveFinancingSupport ?? currentPlan.financingSupport ?? false) ||
      (newPlan.financingSupport ?? false),
    privateNetwork:
      (currentMembership.effectivePrivateNetwork ?? currentPlan.privateNetwork ?? false) ||
      (newPlan.privateNetwork ?? false),

    // Customer features
    freeCalculators:
      (currentMembership.effectiveFreeCalculators ?? currentPlan.freeCalculators ?? false) ||
      (newPlan.freeCalculators ?? false),
    unlimitedRequests:
      (currentMembership.effectiveUnlimitedRequests ?? currentPlan.unlimitedRequests ?? false) ||
      (newPlan.unlimitedRequests ?? false),
    contractorReviewsVisible:
      (currentMembership.effectiveContractorReviewsVisible ??
        currentPlan.contractorReviewsVisible ??
        false) ||
      (newPlan.contractorReviewsVisible ?? false),
    priorityContractorAccess:
      (currentMembership.effectivePriorityContractorAccess ??
        currentPlan.priorityContractorAccess ??
        false) ||
      (newPlan.priorityContractorAccess ?? false),
    propertyValuationSupport:
      (currentMembership.effectivePropertyValuationSupport ??
        currentPlan.propertyValuationSupport ??
        false) ||
      (newPlan.propertyValuationSupport ?? false),
    certifiedAASWork:
      (currentMembership.effectiveCertifiedAASWork ?? currentPlan.certifiedAASWork ?? false) ||
      (newPlan.certifiedAASWork ?? false),
    freeEvaluation:
      (currentMembership.effectiveFreeEvaluation ?? currentPlan.freeEvaluation ?? false) ||
      (newPlan.freeEvaluation ?? false),
  };

  const result = {
    // Duration
    accumulatedDays,
    newEndDate,
    remainingDays,
    newPlanDuration,

    // Leads
    accumulatedLeads,
    bonusLeads,
    effectiveLeadsPerMonth,

    // Contractor benefits
    effectiveAccessDelayHours,
    effectiveRadiusKm,

    // Customer benefits
    effectiveMaxProperties,
    effectivePlatformFeePercentage,
    effectivePropertyType,

    // All boolean features
    ...effectiveFeatures,
  };

  return result;
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
