import dotenv from "dotenv";
dotenv.config();

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
    yearlyPrice: 120000, // $1,020.00 after 15% (full $1,200.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,
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
    stripeProductId: "prod_TJYSbytq3NexsY",
    stripePriceIdMonthly: "price_1SMvLi3U4RkW3GRda48VkQCI",
    stripePriceIdYearly: "price_1SMvLk3U4RkW3GRd8xwkoNpq",
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
    yearlyPrice: 240000, // $2,040.00 after 15% (full $2,400.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,

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
    stripeProductId: "prod_TJYSdSIcXPcC1D",
    stripePriceIdMonthly: "price_1SMvLv3U4RkW3GRdwTWbfUJ1",
    stripePriceIdYearly: "price_1SMvLw3U4RkW3GRdZHD9cuLe",
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
    yearlyPrice: 360000, // $3,060.00 after 15% (full $3,600.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,
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
    stripeProductId: "prod_TJYSwPZa0inBMv",
    stripePriceIdMonthly: "price_1SMvLz3U4RkW3GRdDKFZEfIO",
    stripePriceIdYearly: "price_1SMvM03U4RkW3GRdwVLKGorc",
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
    yearlyPrice: 120000, // $1,020.00 after 15% (full $1,200.00)
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
    stripeProductId: "prod_TJYSqrzi6fhOJZ",
    stripePriceIdMonthly: "price_1SMvM33U4RkW3GRdz4wEG0Nf",
    stripePriceIdYearly: "price_1SMvM43U4RkW3GRd9MwaVM80",
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
      "Off-Market Opportunities access",
    ],
    monthlyPrice: 20000, // $200.00
    yearlyPrice: 240000, // $2,040.00 after 15% (full $2,400.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Contractor-specific features
    leadsPerMonth: 40,
    accessDelayHours: 12,
    radiusKm: 30,
    featuredListing: true,
    offMarketAccess: true,
    publicityReferences: true,
    verifiedBadge: false,
    financingSupport: false,
    privateNetwork: false,
    // Property type access
    propertyType: "domestic", // Standard contractors: domestic properties only
    stripeProductId: "prod_TJYStT1hQ84KkB",
    stripePriceIdMonthly: "price_1SMvMD3U4RkW3GRdT0wvF5Ys",
    stripePriceIdYearly: "price_1SMvMH3U4RkW3GRdlpivJBss",
  },
  {
    name: "Premium Plan",
    description: "For established contractors who want maximum opportunities",
    userType: "contractor",
    tier: "premium",
    features: [
      "75 leads/month",
      "Access after 0h delay",
      "Unlimited radius",
      "Domestic + Commercial properties",
      "Publicity, references + verified badge",
      "Featured listing top priority",
      "Off-Market Opportunities access",
      "Exclusive: Financing support",
    ],
    monthlyPrice: 30000, // $300.00
    yearlyPrice: 360000, // $3,060.00 after 15% (full $3,600.00)
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    // Contractor-specific features
    leadsPerMonth: 75,
    accessDelayHours: 0,
    radiusKm: null, // unlimited
    featuredListing: true,
    offMarketAccess: true,
    publicityReferences: true,
    verifiedBadge: true,
    financingSupport: true,
    privateNetwork: false,
    // Property type access
    propertyType: "commercial", // Premium contractors: domestic + commercial properties
    stripeProductId: "prod_TJYSb1svHDGLB5",
    stripePriceIdMonthly: "price_1SMvML3U4RkW3GRdOF8i1Idf",
    stripePriceIdYearly: "price_1SMvMN3U4RkW3GRdChvhltDm",
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
