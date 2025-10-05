import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MembershipPlan } from "@models/membership";
import { connectDB } from "@config/db";

// Annual discount rate
const ANNUAL_DISCOUNT_RATE = 15; // 15%

const membershipPlans = [
  // CUSTOMER PLANS
  {
    name: "Basic Plan",
    description: "Essential features for homeowners",
    userType: "customer",
    tier: "basic",
    features: [
      "1 property (Domestic)",
      "Free calculators",
      "Unlimited requests",
      "Contractor reviews visible",
      "1% platform fee",
    ],
    monthlyPrice: 10000, // $100.00
    yearlyPrice: 120000, // $1,200.00 (before 15% discount = $1,020.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Customer-specific features
    maxProperties: 1,
    propertyType: "domestic",
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 1, // 1% platform fee
    priorityContractorAccess: false,
    propertyValuationSupport: false,
    certifiedAASWork: false,
    freeEvaluation: false,
    stripeProductId: "prod_T8w06nAcySkbqS",
    stripePriceIdMonthly: "price_1SCe853U4RkW3GRdlLvgTMIR",
    stripePriceIdYearly: "price_1SCe863U4RkW3GRdk6AqZxMF",
    stripePriceIdOneTimeMonthly: "price_1SCeEn3U4RkW3GRd9Tgg2zzJ",
    stripePriceIdOneTimeYearly: "price_1SCeEo3U4RkW3GRd8a2DGPLu",
  },
  {
    name: "Standard Plan",
    description: "Enhanced features for active homeowners",
    userType: "customer",
    tier: "standard",
    features: [
      "Multiple properties (Domestic + Commercial)",
      "Priority access to top contractors",
      "Property valuation support",
      "1% platform fee",
    ],
    monthlyPrice: 20000, // $200.00
    yearlyPrice: 240000, // $2,400.00 (before 15% discount = $2,040.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Customer-specific features
    maxProperties: null, // unlimited
    propertyType: "commercial", // Commercial includes all domestic benefits
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 1, // 1% platform fee
    priorityContractorAccess: true,
    propertyValuationSupport: true,
    certifiedAASWork: false,
    freeEvaluation: false,
    stripeProductId: "prod_T8w08g7VuknEVM",
    stripePriceIdMonthly: "price_1SCe873U4RkW3GRd2yQiulm3",
    stripePriceIdYearly: "price_1SCe873U4RkW3GRdvA6mX6sW",
    stripePriceIdOneTimeMonthly: "price_1SCeEo3U4RkW3GRdADw6mie5",
    stripePriceIdOneTimeYearly: "price_1SCeEp3U4RkW3GRd8mCCIQBq",
  },
  {
    name: "Premium Plan",
    description: "Complete solution for property owners",
    userType: "customer",
    tier: "premium",
    features: [
      "Multiple properties (Domestic + Commercial)",
      "Priority access to top contractors",
      "Property valuation support",
      "Certified AAS work adds resale value",
      "Free evaluation by top specialists",
      "No platform fee",
    ],
    monthlyPrice: 30000, // $300.00
    yearlyPrice: 360000, // $3,600.00 (before 15% discount = $3,060.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Customer-specific features
    maxProperties: null, // unlimited
    propertyType: "commercial",
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 0, // No platform fee
    priorityContractorAccess: true,
    propertyValuationSupport: true,
    certifiedAASWork: true,
    freeEvaluation: true,
    stripeProductId: "prod_T8w0Qce5IA3cBx",
    stripePriceIdMonthly: "price_1SCe883U4RkW3GRdAld2FUof",
    stripePriceIdYearly: "price_1SCe893U4RkW3GRdywczOsgm",
    stripePriceIdOneTimeMonthly: "price_1SCeEp3U4RkW3GRdh3LxE7rP",
    stripePriceIdOneTimeYearly: "price_1SCeEq3U4RkW3GRdUlmXYEB6",
  },

  // CONTRACTOR PLANS
  {
    name: "Basic Plan",
    description: "Perfect for new contractors starting their journey",
    userType: "contractor",
    tier: "basic",
    features: [
      "25 leads/month",
      "Access after 24h delay",
      "15km radius",
      "Domestic properties only",
      "No publicity or references shown",
    ],
    monthlyPrice: 10000, // $100.00
    yearlyPrice: 120000, // $1,200.00 (before 15% discount = $1,020.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Contractor-specific features
    leadsPerMonth: 25,
    accessDelayHours: 24,
    radiusKm: 15,
    featuredListing: false,
    offMarketAccess: false,
    publicityReferences: false,
    verifiedBadge: false,
    financingSupport: false,
    privateNetwork: false,
    // Property type access
    propertyType: "domestic", // Basic contractors: domestic properties only
    stripeProductId: "prod_T8w0AFxXjSW15v",
    stripePriceIdMonthly: "price_1SCe8A3U4RkW3GRdNrlRqfSw",
    stripePriceIdYearly: "price_1SCe8A3U4RkW3GRdZOWH2qgv",
    stripePriceIdOneTimeMonthly: "price_1SCeEq3U4RkW3GRddiLDhV8N",
    stripePriceIdOneTimeYearly: "price_1SCeEr3U4RkW3GRdzGGWcUCU",
  },
  {
    name: "Standard Plan",
    description: "Ideal for growing contractors with more demand",
    userType: "contractor",
    tier: "standard",
    features: [
      "40 leads/month",
      "Access after 12h delay",
      "30km radius",
      "Domestic properties only",
      "Publicity & references shown",
      "Eligible for featured listing",
    ],
    monthlyPrice: 20000, // $200.00
    yearlyPrice: 240000, // $2,400.00 (before 15% discount = $2,040.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Contractor-specific features
    leadsPerMonth: 40,
    accessDelayHours: 12,
    radiusKm: 30,
    featuredListing: true,
    offMarketAccess: false,
    publicityReferences: true,
    verifiedBadge: false,
    financingSupport: false,
    privateNetwork: false,
    // Property type access
    propertyType: "domestic", // Standard contractors: domestic properties only
    stripeProductId: "prod_T8w0n75f6Bsbok",
    stripePriceIdMonthly: "price_1SCe8B3U4RkW3GRdJfaEmzS9",
    stripePriceIdYearly: "price_1SCe8C3U4RkW3GRde9AHhDXu",
    stripePriceIdOneTimeMonthly: "price_1SCeEr3U4RkW3GRdz4ZVC365",
    stripePriceIdOneTimeYearly: "price_1SCeEs3U4RkW3GRdYBQWRQJj",
  },
  {
    name: "Premium Plan",
    description: "For established contractors who want maximum opportunities",
    userType: "contractor",
    tier: "premium",
    features: [
      "Unlimited leads",
      "Instant access",
      "Unlimited radius",
      "Domestic + Commercial properties",
      "Publicity, references + verified badge",
      "Featured listing top priority",
      "Exclusive: Off-Market Opportunities + Financing support",
      "Private network (notary, lawyer, specialists, discounts)",
    ],
    monthlyPrice: 30000, // $300.00
    yearlyPrice: 360000, // $3,600.00 (before 15% discount = $3,060.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Contractor-specific features
    leadsPerMonth: null, // unlimited
    accessDelayHours: 0, // instant access
    radiusKm: null, // unlimited
    featuredListing: true,
    offMarketAccess: true,
    publicityReferences: true,
    verifiedBadge: true,
    financingSupport: true,
    privateNetwork: true,
    // Property type access
    propertyType: "commercial", // Premium contractors: domestic + commercial properties
    stripeProductId: "prod_T8w0Dx6DssNc0z",
    stripePriceIdMonthly: "price_1SCe8D3U4RkW3GRdI2VVmlu2",
    stripePriceIdYearly: "price_1SCe8D3U4RkW3GRddd5w5pRJ",
    stripePriceIdOneTimeMonthly: "price_1SCeEs3U4RkW3GRdVMrohzaH",
    stripePriceIdOneTimeYearly: "price_1SCeEt3U4RkW3GRd8vn08OG4",
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
