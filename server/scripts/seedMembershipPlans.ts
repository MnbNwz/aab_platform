import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MembershipPlan } from "@models/membershipPlan";
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
    description: "Essential tools for independent contractors",
    userType: "contractor",
    tier: "basic",
    features: [
      "Job management",
      "Basic analytics",
      "Customer communication tools",
      "Payment processing",
    ],
    monthlyPrice: 100, // $1.00
    yearlyPrice: 1200, // $12.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    stripePriceIdMonthly: "price_contractor_basic_monthly",
    stripePriceIdYearly: "price_contractor_basic_yearly",
  },
  {
    name: "Standard Contractor Plan",
    description: "Advanced tools for growing businesses",
    userType: "contractor",
    tier: "standard",
    features: [
      "Advanced job management",
      "Detailed analytics",
      "Enhanced customer tools",
      "Payment processing",
      "Lead generation",
      "Scheduling tools",
    ],
    monthlyPrice: 200, // $2.00
    yearlyPrice: 2400, // $24.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    stripePriceIdMonthly: "price_contractor_standard_monthly",
    stripePriceIdYearly: "price_contractor_standard_yearly",
  },
  {
    name: "Premium Contractor Plan",
    description: "Complete business solution for contractors",
    userType: "contractor",
    tier: "premium",
    features: [
      "Complete business management",
      "Advanced analytics & reporting",
      "Full customer relationship tools",
      "Priority payment processing",
      "Premium lead generation",
      "Advanced scheduling & routing",
      "24/7 business support",
    ],
    monthlyPrice: 300, // $3.00
    yearlyPrice: 3600, // $36.00 (before discount)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
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
