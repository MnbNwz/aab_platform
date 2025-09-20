import { MembershipPlan, IMembershipPlan } from "@models/membershipPlan";
import { UserMembership, IUserMembership } from "@models/userMembership";
import mongoose from "mongoose";

// Securely get a plan by ID, with validation
export async function getPlanById(planId: string) {
  if (!planId || typeof planId !== "string") throw new Error("Invalid planId");
  const plan = await MembershipPlan.findById(planId);
  if (!plan || !plan.isActive) throw new Error("Plan not found or inactive");
  return plan;
}

// Get all available plans
export async function getAllPlans(): Promise<IMembershipPlan[]> {
  return await MembershipPlan.find({ isActive: true }).sort({ userType: 1, price: 1 });
}

// Get plans by user type
export async function getPlansByUserType(
  userType: "customer" | "contractor",
): Promise<IMembershipPlan[]> {
  return await MembershipPlan.find({ userType, isActive: true }).sort({
    tier: 1,
    billingPeriod: 1,
  });
}

// Get plans by user type and billing period
export async function getPlansByUserTypeAndBilling(
  userType: "customer" | "contractor",
  billingPeriod: "monthly" | "yearly",
): Promise<IMembershipPlan[]> {
  return await MembershipPlan.find({
    userType,
    billingPeriod,
    isActive: true,
  }).sort({ tier: 1 });
}

// Get user's current active membership
export async function getCurrentMembership(userId: string): Promise<IUserMembership | null> {
  return await UserMembership.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: "active",
    endDate: { $gt: new Date() },
  }).populate("planId");
}

// Determine billing period from Stripe Price ID by looking up in database
export async function determineBillingPeriodFromStripePrice(
  stripePriceId: string,
): Promise<"monthly" | "yearly"> {
  const plan = await MembershipPlan.findOne({
    $or: [{ stripePriceIdMonthly: stripePriceId }, { stripePriceIdYearly: stripePriceId }],
  });
  if (!plan) {
    throw new Error(`No plan found with Stripe Price ID: ${stripePriceId}`);
  }
  if (plan.stripePriceIdMonthly === stripePriceId) {
    return "monthly";
  } else if (plan.stripePriceIdYearly === stripePriceId) {
    return "yearly";
  }
  throw new Error(`Cannot determine billing period from Stripe Price ID: ${stripePriceId}`);
}

// Validate billing period against payment amount
export function validateBillingPeriod(
  plan: IMembershipPlan,
  billingPeriod: "monthly" | "yearly",
  paymentAmount: number,
): boolean {
  if (billingPeriod === "monthly") {
    return paymentAmount === plan.monthlyPrice;
  } else {
    const discountedPrice = Math.round(plan.yearlyPrice * (1 - plan.annualDiscountRate / 100));
    return paymentAmount === discountedPrice;
  }
}
