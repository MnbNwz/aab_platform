import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { MembershipPlan } from "@models/membership";
import { connectDB } from "@config/db";

// Load production environment
// On local: use .env.production
// On EC2: .env is already production, so use .env
const envProdPath = path.join(__dirname, "../.env.production");
const envPath = path.join(__dirname, "../.env");

// Force load .env.production first with override
if (fs.existsSync(envProdPath)) {
  // Local development - use .env.production and override any existing env
  config({ path: envProdPath, override: true });
} else {
  // Production server - .env is already production
  config({ path: envPath, override: true });
}

// Annual discount rate
const ANNUAL_DISCOUNT_RATE = 15; // 15%

// Membership plans with HARDCODED Stripe IDs from live mode
// These products/prices already exist in Stripe LIVE mode
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
    yearlyPrice: 120000, // $1,200.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,
    maxProperties: 1,
    propertyType: "domestic",
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 1,
    priorityContractorAccess: false,
    propertyValuationSupport: false,
    certifiedAASWork: false,
    freeEvaluation: false,
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbXnxYXe4NFy",
    stripePriceIdMonthly: "price_1SMvVn35zNvmKFA7CW8mICyJ",
    stripePriceIdYearly: "price_1SMvVo35zNvmKFA7aTDs0fuE",
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
    yearlyPrice: 240000, // $2,400.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,
    maxProperties: null,
    propertyType: "commercial",
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 1,
    priorityContractorAccess: true,
    propertyValuationSupport: true,
    certifiedAASWork: false,
    freeEvaluation: false,
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbYoM6ZuXDIS",
    stripePriceIdMonthly: "price_1SMvVp35zNvmKFA71irXjelW",
    stripePriceIdYearly: "price_1SMvVp35zNvmKFA7l6JEZult",
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
    yearlyPrice: 360000, // $3,600.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    accessDelayHours: 0,
    maxProperties: null,
    propertyType: "commercial",
    freeCalculators: true,
    unlimitedRequests: true,
    contractorReviewsVisible: true,
    platformFeePercentage: 0,
    priorityContractorAccess: true,
    propertyValuationSupport: true,
    certifiedAASWork: true,
    freeEvaluation: true,
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbE55UN6lmXd",
    stripePriceIdMonthly: "price_1SMvVq35zNvmKFA7WAPY8icS",
    stripePriceIdYearly: "price_1SMvVr35zNvmKFA75fld8IDS",
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
    yearlyPrice: 120000, // $1,200.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: 25,
    accessDelayHours: 24,
    radiusKm: 15,
    featuredListing: false,
    offMarketAccess: false,
    publicityReferences: false,
    verifiedBadge: false,
    financingSupport: false,
    privateNetwork: false,
    propertyType: "domestic",
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbAE0xfr8xNV",
    stripePriceIdMonthly: "price_1SMvVs35zNvmKFA7iE3WXfdk",
    stripePriceIdYearly: "price_1SMvVs35zNvmKFA7IwdILrpW",
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
    yearlyPrice: 240000, // $2,400.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: 40,
    accessDelayHours: 12,
    radiusKm: 30,
    featuredListing: true,
    offMarketAccess: true,
    publicityReferences: true,
    verifiedBadge: false,
    financingSupport: false,
    privateNetwork: false,
    propertyType: "domestic",
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbdppEVklwzJ",
    stripePriceIdMonthly: "price_1SMvVt35zNvmKFA72V2Q4rGf",
    stripePriceIdYearly: "price_1SMvVu35zNvmKFA71mIFEDS4",
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
    yearlyPrice: 360000, // $3,600.00
    annualDiscountRate: ANNUAL_DISCOUNT_RATE,
    duration: 30,
    leadsPerMonth: 75,
    accessDelayHours: 0,
    radiusKm: null,
    featuredListing: true,
    offMarketAccess: true,
    publicityReferences: true,
    verifiedBadge: true,
    financingSupport: true,
    privateNetwork: false,
    propertyType: "commercial",
    // Hardcoded Stripe IDs (LIVE mode)
    stripeProductId: "prod_TJYbRkcMB5k7nv",
    stripePriceIdMonthly: "price_1SMvVu35zNvmKFA7rO1TMRUJ",
    stripePriceIdYearly: "price_1SMvVv35zNvmKFA7XNAshAml",
  },
];

export const seedMembershipPlansProd = async () => {
  try {
    console.log("🚀 Starting PRODUCTION membership plans seeding...");
    console.log("📝 Mode: READ-ONLY (no Stripe API calls)");
    console.log("🔒 Using hardcoded live Stripe product IDs\n");

    await connectDB();
    console.log("✅ Connected to production database\n");

    const results = [];

    for (const planData of membershipPlans) {
      console.log(`\n📦 Processing: ${planData.name} (${planData.userType} - ${planData.tier})`);

      // Find existing plan or create new one (preserve ID)
      const existingPlan = await MembershipPlan.findOne({
        userType: planData.userType,
        tier: planData.tier,
      });

      if (existingPlan) {
        // Update existing plan to preserve ID
        Object.assign(existingPlan, {
          ...planData,
          isActive: true,
        });
        await existingPlan.save();
        console.log(`  ✅ Plan updated in database: ${existingPlan._id}`);
        console.log(`  📌 Product: ${planData.stripeProductId}`);
        console.log(`  📌 Monthly: ${planData.stripePriceIdMonthly}`);
        console.log(`  📌 Yearly: ${planData.stripePriceIdYearly}`);

        results.push({
          planId: existingPlan._id.toString(),
          planName: planData.name,
          userType: planData.userType,
          tier: planData.tier,
          stripeProductId: planData.stripeProductId,
          stripePriceIdMonthly: planData.stripePriceIdMonthly,
          stripePriceIdYearly: planData.stripePriceIdYearly,
          action: "Updated existing plan",
        });
      } else {
        // Create new plan if doesn't exist
        const plan = new MembershipPlan({
          ...planData,
          isActive: true,
        });
        await plan.save();
        console.log(`  ✅ Plan created in database: ${plan._id}`);
        console.log(`  📌 Product: ${planData.stripeProductId}`);
        console.log(`  📌 Monthly: ${planData.stripePriceIdMonthly}`);
        console.log(`  📌 Yearly: ${planData.stripePriceIdYearly}`);

        results.push({
          planId: plan._id.toString(),
          planName: planData.name,
          userType: planData.userType,
          tier: planData.tier,
          stripeProductId: planData.stripeProductId,
          stripePriceIdMonthly: planData.stripePriceIdMonthly,
          stripePriceIdYearly: planData.stripePriceIdYearly,
          action: "Created new plan",
        });
      }
    }

    console.log("\n\n🎉 Summary:");
    console.log("=".repeat(80));
    results.forEach((result) => {
      console.log(`\nPlan: ${result.planName} (${result.userType} - ${result.tier})`);
      console.log(`  Plan ID: ${result.planId}`);
      console.log(`  Product ID: ${result.stripeProductId}`);
      console.log(`  Monthly Price ID: ${result.stripePriceIdMonthly}`);
      console.log(`  Yearly Price ID: ${result.stripePriceIdYearly}`);
      console.log(`  Action: ${result.action}`);
    });
    console.log("\n" + "=".repeat(80));
    console.log(`\n✅ Successfully seeded ${results.length} membership plans in PRODUCTION!`);
    console.log("ℹ️  No Stripe API calls were made - used hardcoded live IDs");

    return results;
  } catch (error) {
    console.error("\n❌ Error seeding membership plans:", error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedMembershipPlansProd();
      process.exit(0);
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    }
  })();
}
