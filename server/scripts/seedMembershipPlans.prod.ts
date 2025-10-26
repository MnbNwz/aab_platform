import dotenv from "dotenv";
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import Stripe from "stripe";
import { MembershipPlan } from "@models/membership";
import { connectDB } from "@config/db";
// Load production environment
// On local: use .env.production
// On EC2: .env is already production, so use .env
const envProdPath = path.join(__dirname, "../.env.production");
const envPath = path.join(__dirname, "../.env");

if (fs.existsSync(envProdPath)) {
  // Local development - use .env.production
  config({ path: envProdPath });
} else {
  // Production server - .env is already production
  config({ path: envPath });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Annual discount rate
const ANNUAL_DISCOUNT_RATE = 15; // 15%

// Membership plans to seed (without Stripe IDs - will be created)
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
  },
];

export const seedMembershipPlansProd = async () => {
  try {
    console.log("🚀 Starting PRODUCTION membership plans seeding...");
    console.log(`Using Stripe key: ${process.env.STRIPE_SECRET_KEY!.substring(0, 20)}...`);
    console.log(
      `Mode: ${process.env.STRIPE_SECRET_KEY!.startsWith("sk_live_") ? "LIVE" : "TEST"}\n`,
    );

    await connectDB();
    console.log("✅ Connected to database\n");

    // Get existing products to avoid duplicates
    console.log("🔍 Checking for existing Stripe products...");
    const existingProducts = await stripe.products.list({ limit: 100 });
    console.log(`Found ${existingProducts.data.length} existing products\n`);

    // Note: We'll update existing plans instead of deleting to preserve IDs

    const results = [];

    for (const planData of membershipPlans) {
      const productName = `${planData.name} - ${planData.userType === "customer" ? "Customer" : "Contractor"}`;
      console.log(`\n📦 Processing: ${planData.name} (${planData.userType} - ${planData.tier})`);

      // Check if product already exists in Stripe
      let product;
      const existingProduct = existingProducts.data.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );

      if (existingProduct) {
        console.log(`  ⚠️  Product already exists in Stripe: ${existingProduct.id}`);
        product = existingProduct;

        // Get existing prices
        const existingPrices = await stripe.prices.list({
          product: product.id,
          limit: 100,
        });

        const monthlyPriceExisting = existingPrices.data.find(
          (p) => p.recurring?.interval === "month",
        );
        const yearlyPriceExisting = existingPrices.data.find(
          (p) => p.recurring?.interval === "year",
        );

        if (monthlyPriceExisting && yearlyPriceExisting) {
          console.log(`  ⚠️  Using existing prices`);
          console.log(`  📌 Monthly: ${monthlyPriceExisting.id}`);
          console.log(`  📌 Yearly: ${yearlyPriceExisting.id}`);

          // Find existing plan or create new one (preserve ID)
          const existingPlan = await MembershipPlan.findOne({
            userType: planData.userType,
            tier: planData.tier,
          });

          if (existingPlan) {
            // Update existing plan to preserve ID
            Object.assign(existingPlan, {
              ...planData,
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPriceExisting.id,
              stripePriceIdYearly: yearlyPriceExisting.id,
              isActive: true,
            });
            await existingPlan.save();
            console.log(`  ✅ Plan updated in database: ${existingPlan._id}`);

            results.push({
              planId: existingPlan._id.toString(),
              planName: planData.name,
              userType: planData.userType,
              tier: planData.tier,
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPriceExisting.id,
              stripePriceIdYearly: yearlyPriceExisting.id,
              action: "Updated existing plan with Stripe products",
            });
          } else {
            // Create new plan if doesn't exist
            const plan = new MembershipPlan({
              ...planData,
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPriceExisting.id,
              stripePriceIdYearly: yearlyPriceExisting.id,
              isActive: true,
            });
            await plan.save();
            console.log(`  ✅ Plan created in database: ${plan._id}`);

            results.push({
              planId: plan._id.toString(),
              planName: planData.name,
              userType: planData.userType,
              tier: planData.tier,
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPriceExisting.id,
              stripePriceIdYearly: yearlyPriceExisting.id,
              action: "Created new plan with existing Stripe products",
            });
          }
          continue;
        }
      } else {
        // Create new Stripe Product
        product = await stripe.products.create({
          name: productName,
          description: planData.description,
          metadata: {
            userType: planData.userType,
            tier: planData.tier,
          },
        });
        console.log(`  ✅ Product created in Stripe: ${product.id}`);
      }

      // Check for existing prices for this product
      const existingPrices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      // Create Monthly Price (only if not existing)
      let monthlyPrice;
      const existingMonthly = existingPrices.data.find((p) => p.recurring?.interval === "month");

      if (existingMonthly) {
        monthlyPrice = existingMonthly;
        console.log(`  ⚠️  Monthly price already exists: ${monthlyPrice.id}`);
      } else {
        monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: planData.monthlyPrice,
          currency: "usd",
          recurring: {
            interval: "month",
          },
          metadata: {
            billingPeriod: "monthly",
            userType: planData.userType,
            tier: planData.tier,
          },
        });
        console.log(
          `  ✅ Monthly price created: ${monthlyPrice.id} ($${planData.monthlyPrice / 100}/month)`,
        );
      }

      // Create Yearly Price (only if not existing)
      let yearlyPrice;
      const existingYearly = existingPrices.data.find((p) => p.recurring?.interval === "year");

      if (existingYearly) {
        yearlyPrice = existingYearly;
        console.log(`  ⚠️  Yearly price already exists: ${yearlyPrice.id}`);
      } else {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: planData.yearlyPrice,
          currency: "usd",
          recurring: {
            interval: "year",
          },
          metadata: {
            billingPeriod: "yearly",
            userType: planData.userType,
            tier: planData.tier,
          },
        });
        console.log(
          `  ✅ Yearly price created: ${yearlyPrice.id} ($${planData.yearlyPrice / 100}/year)`,
        );
      }

      // Find existing plan or create new one (preserve ID)
      const existingPlan = await MembershipPlan.findOne({
        userType: planData.userType,
        tier: planData.tier,
      });

      if (existingPlan) {
        // Update existing plan to preserve ID
        Object.assign(existingPlan, {
          ...planData,
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
          isActive: true,
        });
        await existingPlan.save();
        console.log(`  ✅ Plan updated in database: ${existingPlan._id}`);

        results.push({
          planId: existingPlan._id.toString(),
          planName: planData.name,
          userType: planData.userType,
          tier: planData.tier,
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
          action: "Updated existing plan",
        });
      } else {
        // Create new plan if doesn't exist
        const plan = new MembershipPlan({
          ...planData,
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
          isActive: true,
        });
        await plan.save();
        console.log(`  ✅ Plan created in database: ${plan._id}`);

        results.push({
          planId: plan._id.toString(),
          planName: planData.name,
          userType: planData.userType,
          tier: planData.tier,
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
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
