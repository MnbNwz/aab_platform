import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MembershipPlan } from "@models/membership";
import { connectDB } from "@config/db";

// Annual discount rate
const ANNUAL_DISCOUNT_RATE = 15; // 15%

const membershipPlans = [
  {
    name: "Basic Customer Plan",
    description: "Essential features for homeowners",
    userType: "customer",
    tier: "basic",
    features: [
      "Basic property management",
      "5 service requests per month",
      "Standard support",
      "Basic dashboard access",
    ],
    monthlyPrice: 100, // $1.00
    yearlyPrice: 1200, // $12.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    stripePriceIdMonthly: "price_customer_basic_monthly", // Replace with real Stripe Price ID
    stripePriceIdYearly: "price_customer_basic_yearly", // Replace with real Stripe Price ID
  },
  {
    name: "Standard Customer Plan",
    description: "Enhanced features for active homeowners",
    userType: "customer",
    tier: "standard",
    features: [
      "Advanced property management",
      "15 service requests per month",
      "Priority support",
      "Maintenance scheduling",
      "Advanced analytics",
    ],
    monthlyPrice: 200, // $2.00
    yearlyPrice: 2400, // $24.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    stripePriceIdMonthly: "price_customer_standard_monthly",
    stripePriceIdYearly: "price_customer_standard_yearly",
  },
  {
    name: "Premium Customer Plan",
    description: "Complete solution for property owners",
    userType: "customer",
    tier: "premium",
    features: [
      "Unlimited service requests",
      "24/7 premium support",
      "Advanced maintenance scheduling",
      "Full analytics suite",
      "Priority contractor matching",
      "Emergency services",
    ],
    monthlyPrice: 300, // $3.00
    yearlyPrice: 3600, // $36.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    stripePriceIdMonthly: "price_customer_premium_monthly",
    stripePriceIdYearly: "price_customer_premium_yearly",
  },
  {
    name: "Basic Contractor Plan",
    description: "Perfect for new contractors starting their journey",
    userType: "contractor",
    tier: "basic",
    features: [
      "25 leads per month",
      "24-hour access delay",
      "15km radius coverage",
      "Basic job notifications",
      "Standard support",
    ],
    monthlyPrice: 2999, // $29.99
    yearlyPrice: 29999, // $299.99 (save ~17%)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: 25,
    accessDelayHours: 24,
    radiusKm: 15,
    featuredListing: false,
    offMarketAccess: false,
    stripePriceIdMonthly: "price_contractor_basic_monthly",
    stripePriceIdYearly: "price_contractor_basic_yearly",
  },
  {
    name: "Standard Contractor Plan",
    description: "Ideal for growing contractors with more demand",
    userType: "contractor",
    tier: "standard",
    features: [
      "40 leads per month",
      "12-hour access delay",
      "30km radius coverage",
      "Priority job notifications",
      "Priority support",
      "Enhanced profile visibility",
    ],
    monthlyPrice: 4999, // $49.99
    yearlyPrice: 49999, // $499.99 (save ~17%)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: 40,
    accessDelayHours: 12,
    radiusKm: 30,
    featuredListing: false,
    offMarketAccess: false,
    stripePriceIdMonthly: "price_contractor_standard_monthly",
    stripePriceIdYearly: "price_contractor_standard_yearly",
  },
  {
    name: "Premium Contractor Plan",
    description: "For established contractors who want maximum opportunities",
    userType: "contractor",
    tier: "premium",
    features: [
      "Unlimited leads",
      "Instant access to new jobs",
      "Unlimited radius coverage",
      "Featured listing priority",
      "Exclusive off-market opportunities",
      "Premium support",
      "Advanced analytics",
      "Custom branding",
    ],
    monthlyPrice: 9999, // $99.99
    yearlyPrice: 99999, // $999.99 (save ~17%)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: null, // unlimited
    accessDelayHours: 0, // instant access
    radiusKm: null, // unlimited
    featuredListing: true,
    offMarketAccess: true,
    stripePriceIdMonthly: "price_contractor_premium_monthly",
    stripePriceIdYearly: "price_contractor_premium_yearly",
  },
];

export const seedMembershipPlans = async () => {
  try {
    console.log("Starting membership plans seeding...");

    // Clear existing plans
    await MembershipPlan.deleteMany({});
    console.log("Cleared existing membership plans");

    // Insert new plans
    const createdPlans = await MembershipPlan.insertMany(membershipPlans);
    console.log(`Created ${createdPlans.length} membership plans:`);

    createdPlans.forEach((plan) => {
      console.log(
        `- ${plan.name} (${plan.userType} - ${plan.tier}) - Monthly: $${plan.monthlyPrice / 100}, Yearly: $${plan.yearlyPrice / 100} (${plan.annualDiscountRate}% discount)`,
      );
    });

    return createdPlans;
  } catch (error) {
    console.error("Error seeding membership plans:", error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedMembershipPlans();
      console.log("Membership plans seeded successfully!");
      process.exit(0);
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    }
  })();
}
