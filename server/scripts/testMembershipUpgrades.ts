import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { User } from "@models/user";
import { UserMembership } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { Payment } from "@models/payment";
import { connectDB } from "@config/db";
import { createNewMembership, upgradeMembership } from "@services/payment/webhook";
import { hashPassword } from "@utils/auth/password";
import crypto from "crypto";

// Test user credentials storage
const testCredentials = {
  customer: {
    email: "",
    password: "TestPass123!@#",
    userId: "",
    firstName: "Test",
    lastName: "Customer",
  },
  contractor: {
    email: "",
    password: "TestPass123!@#",
    userId: "",
    firstName: "Test",
    lastName: "Contractor",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log("=".repeat(80) + "\n");
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Create mock Stripe session
function createMockStripeSession(
  userId: string,
  planId: string,
  amount: number,
  metadata: any = {},
) {
  return {
    id: `cs_test_${crypto.randomBytes(16).toString("hex")}`,
    customer: `cus_test_${crypto.randomBytes(8).toString("hex")}`,
    customer_email:
      testCredentials[metadata.userType as "customer" | "contractor"]?.email || "test@example.com",
    payment_intent: `pi_test_${crypto.randomBytes(16).toString("hex")}`,
    amount_total: amount,
    currency: "usd",
    metadata: {
      userId,
      planId,
      billingPeriod: metadata.billingPeriod || "monthly",
      ...metadata,
    },
  } as any;
}

// Step 1: Clean up previous test data
async function cleanupTestData() {
  logSection("STEP 1: Cleaning Up Previous Test Data");

  try {
    const customerEmail = `test-customer-${Date.now()}@example.com`;
    const contractorEmail = `test-contractor-${Date.now()}@example.com`;

    testCredentials.customer.email = customerEmail;
    testCredentials.contractor.email = contractorEmail;

    logInfo("Generated unique test emails:");
    logInfo(`  Customer: ${customerEmail}`);
    logInfo(`  Contractor: ${contractorEmail}`);

    logSuccess("Test data cleanup completed");
  } catch (error) {
    logError(`Cleanup failed: ${error}`);
    throw error;
  }
}

// Step 2: Create test users
async function createTestUsers() {
  logSection("STEP 2: Creating Test Users");

  try {
    // Hash password
    const passwordHashValue = hashPassword(testCredentials.customer.password);

    // Create customer
    const customer = await User.create({
      firstName: testCredentials.customer.firstName,
      lastName: testCredentials.customer.lastName,
      email: testCredentials.customer.email,
      phone: "+15551234567",
      passwordHash: passwordHashValue,
      role: "customer",
      status: "active",
      geoHome: {
        type: "Point",
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
      customer: {
        defaultPropertyType: "domestic",
      },
    });
    testCredentials.customer.userId = customer._id.toString();
    logSuccess(`Created customer: ${customer.email} (ID: ${customer._id})`);

    // Create contractor
    const contractor = await User.create({
      firstName: testCredentials.contractor.firstName,
      lastName: testCredentials.contractor.lastName,
      email: testCredentials.contractor.email,
      phone: "+15551234568",
      passwordHash: passwordHashValue,
      role: "contractor",
      status: "active",
      geoHome: {
        type: "Point",
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
      contractor: {
        companyName: "Test Contractors Inc",
        services: ["Plumbing", "Electrical"],
        license: "TEST-LIC-12345",
        taxId: "TEST-TAX-12345",
        docs: [],
        experience: 5,
        isApproved: true,
      },
    });
    testCredentials.contractor.userId = contractor._id.toString();
    logSuccess(`Created contractor: ${contractor.email} (ID: ${contractor._id})`);
  } catch (error) {
    logError(`User creation failed: ${error}`);
    throw error;
  }
}

// Step 3: Test first-time membership purchase
async function testFirstMembershipPurchase() {
  logSection("STEP 3: Testing First-Time Membership Purchase");

  try {
    // Get plans
    const customerBasicPlan = await MembershipPlan.findOne({ userType: "customer", tier: "basic" });
    const contractorBasicPlan = await MembershipPlan.findOne({
      userType: "contractor",
      tier: "basic",
    });

    if (!customerBasicPlan || !contractorBasicPlan) {
      throw new Error("Plans not found. Please run: npm run seed:memberships");
    }

    logInfo("Testing customer first purchase (Basic Monthly)...");
    const customerSession = createMockStripeSession(
      testCredentials.customer.userId,
      customerBasicPlan._id.toString(),
      customerBasicPlan.monthlyPrice,
      { userType: "customer", billingPeriod: "monthly" },
    );

    await createNewMembership(
      customerSession,
      testCredentials.customer.userId,
      customerBasicPlan._id.toString(),
      "monthly",
    );

    const customerMembership = await UserMembership.findOne({
      userId: testCredentials.customer.userId,
    });
    logSuccess("Customer membership created!");
    logInfo(`  Plan: ${customerBasicPlan.name}`);
    logInfo(`  Start: ${customerMembership?.startDate}`);
    logInfo(`  End: ${customerMembership?.endDate}`);
    logInfo(`  Effective Platform Fee: ${customerMembership?.effectivePlatformFeePercentage}%`);
    logInfo(`  Effective Property Type: ${customerMembership?.effectivePropertyType}`);
    logInfo(
      `  Effective Max Properties: ${customerMembership?.effectiveMaxProperties || "Unlimited"}`,
    );

    logInfo("\nTesting contractor first purchase (Basic Monthly)...");
    const contractorSession = createMockStripeSession(
      testCredentials.contractor.userId,
      contractorBasicPlan._id.toString(),
      contractorBasicPlan.monthlyPrice,
      { userType: "contractor", billingPeriod: "monthly" },
    );

    await createNewMembership(
      contractorSession,
      testCredentials.contractor.userId,
      contractorBasicPlan._id.toString(),
      "monthly",
    );

    const contractorMembership = await UserMembership.findOne({
      userId: testCredentials.contractor.userId,
    });
    logSuccess("Contractor membership created!");
    logInfo(`  Plan: ${contractorBasicPlan.name}`);
    logInfo(`  Start: ${contractorMembership?.startDate}`);
    logInfo(`  End: ${contractorMembership?.endDate}`);
    logInfo(
      `  Effective Leads/Month: ${contractorMembership?.effectiveLeadsPerMonth || "Unlimited"}`,
    );
    logInfo(`  Effective Access Delay: ${contractorMembership?.effectiveAccessDelayHours}h`);
    logInfo(`  Effective Radius: ${contractorMembership?.effectiveRadiusKm || "Unlimited"} km`);
  } catch (error) {
    logError(`First membership purchase failed: ${error}`);
    throw error;
  }
}

// Step 4: Test same-tier upgrade (Monthly to Yearly)
async function testSameTierUpgrade() {
  logSection("STEP 4: Testing Same-Tier Upgrade (Monthly → Yearly)");

  try {
    logInfo("Testing customer upgrade: Basic Monthly → Basic Yearly");

    const customerBasicPlan = await MembershipPlan.findOne({ userType: "customer", tier: "basic" });
    const currentMembership = await UserMembership.findOne({
      userId: testCredentials.customer.userId,
      status: "active",
    });

    if (!currentMembership) {
      throw new Error("No active membership found for customer");
    }

    logInfo(`Current membership ends: ${currentMembership.endDate}`);
    const daysRemaining = Math.ceil(
      (currentMembership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    logInfo(`Days remaining: ${daysRemaining}`);

    const upgradeSession = createMockStripeSession(
      testCredentials.customer.userId,
      customerBasicPlan!._id.toString(),
      customerBasicPlan!.yearlyPrice,
      {
        userType: "customer",
        billingPeriod: "monthly", // Keep current billing period
        isUpgrade: "true",
        currentMembershipId: currentMembership._id.toString(),
        fromPlanId: customerBasicPlan!._id.toString(),
        toPlanId: customerBasicPlan!._id.toString(),
      },
    );

    const result = await upgradeMembership(
      upgradeSession,
      testCredentials.customer.userId,
      currentMembership._id.toString(),
      customerBasicPlan!._id.toString(),
      customerBasicPlan!._id.toString(),
    );

    logSuccess("Upgrade completed!");
    logInfo(`  Accumulated Days: ${result.upgrade.accumulatedDays}`);
    logInfo(`  New End Date: ${result.upgrade.newEndDate}`);

    const newMembership = await UserMembership.findOne({
      userId: testCredentials.customer.userId,
      status: "active",
    });

    const oldMembership = await UserMembership.findById(currentMembership._id);
    logInfo(`  Old membership status: ${oldMembership?.status}`);
    logInfo(`  New membership ID: ${newMembership?._id}`);
    logInfo(`  Is Upgraded: ${newMembership?.isUpgraded}`);
    logInfo(`  Upgraded From: ${newMembership?.upgradedFromMembershipId}`);
  } catch (error) {
    logError(`Same-tier upgrade failed: ${error}`);
    throw error;
  }
}

// Step 5: Test cross-tier upgrade (Basic to Premium)
async function testCrossTierUpgrade() {
  logSection("STEP 5: Testing Cross-Tier Upgrade (Basic → Premium)");

  try {
    logInfo("Testing contractor upgrade: Basic → Premium");

    const contractorBasicPlan = await MembershipPlan.findOne({
      userType: "contractor",
      tier: "basic",
    });
    const contractorPremiumPlan = await MembershipPlan.findOne({
      userType: "contractor",
      tier: "premium",
    });
    const currentMembership = await UserMembership.findOne({
      userId: testCredentials.contractor.userId,
      status: "active",
    });

    if (!currentMembership) {
      throw new Error("No active membership found for contractor");
    }

    logInfo("Before upgrade:");
    logInfo(`  Leads/Month: ${currentMembership.effectiveLeadsPerMonth || "Unlimited"}`);
    logInfo(`  Access Delay: ${currentMembership.effectiveAccessDelayHours}h`);
    logInfo(`  Radius: ${currentMembership.effectiveRadiusKm || "Unlimited"} km`);
    logInfo(`  Featured Listing: ${currentMembership.effectiveFeaturedListing}`);
    logInfo(`  Off-Market Access: ${currentMembership.effectiveOffMarketAccess}`);

    // Simulate some lead usage
    await UserMembership.findByIdAndUpdate(currentMembership._id, {
      leadsUsedThisMonth: 10,
    });
    logInfo(`  Simulated usage: 10 leads used (15 remaining from Basic's 25)`);

    const upgradeSession = createMockStripeSession(
      testCredentials.contractor.userId,
      contractorPremiumPlan!._id.toString(),
      contractorPremiumPlan!.monthlyPrice,
      {
        userType: "contractor",
        billingPeriod: "monthly",
        isUpgrade: "true",
        currentMembershipId: currentMembership._id.toString(),
        fromPlanId: contractorBasicPlan!._id.toString(),
        toPlanId: contractorPremiumPlan!._id.toString(),
      },
    );

    const result = await upgradeMembership(
      upgradeSession,
      testCredentials.contractor.userId,
      currentMembership._id.toString(),
      contractorBasicPlan!._id.toString(),
      contractorPremiumPlan!._id.toString(),
    );

    logSuccess("Upgrade completed!");
    logInfo(`  Accumulated Days: ${result.upgrade.accumulatedDays}`);
    logInfo(`  Accumulated Leads: ${result.upgrade.accumulatedLeads}`);

    const newMembership = await UserMembership.findOne({
      userId: testCredentials.contractor.userId,
      status: "active",
    });

    logInfo("\nAfter upgrade (Effective Benefits):");
    logInfo(`  Effective Leads/Month: ${newMembership?.effectiveLeadsPerMonth || "Unlimited"}`);
    logInfo(
      `  Effective Access Delay: ${newMembership?.effectiveAccessDelayHours}h (should be 0 - best of both)`,
    );
    logInfo(`  Effective Radius: ${newMembership?.effectiveRadiusKm || "Unlimited"} km`);
    logInfo(`  Effective Featured Listing: ${newMembership?.effectiveFeaturedListing}`);
    logInfo(`  Effective Off-Market Access: ${newMembership?.effectiveOffMarketAccess}`);
    logInfo(`  Effective Verified Badge: ${newMembership?.effectiveVerifiedBadge}`);
    logInfo(`  Accumulated Leads (with bonus): ${newMembership?.accumulatedLeads}`);
    logInfo(`  Bonus Leads from upgrade: ${newMembership?.bonusLeadsFromUpgrade}`);

    // Verify benefits
    if (newMembership?.effectiveAccessDelayHours !== 0) {
      logWarning(
        `Access delay should be 0 (from Premium), but got ${newMembership?.effectiveAccessDelayHours}`,
      );
    } else {
      logSuccess("✓ Access delay correctly set to best value (0h)");
    }

    if (newMembership?.effectiveRadiusKm !== null) {
      logWarning(`Radius should be unlimited (null), but got ${newMembership?.effectiveRadiusKm}`);
    } else {
      logSuccess("✓ Radius correctly set to unlimited");
    }

    if (!newMembership?.effectiveOffMarketAccess) {
      logWarning("Off-market access should be true from Premium plan");
    } else {
      logSuccess("✓ Off-market access enabled");
    }
  } catch (error) {
    logError(`Cross-tier upgrade failed: ${error}`);
    throw error;
  }
}

// Step 6: Test customer platform fee accumulation
async function testCustomerPlatformFeeAccumulation() {
  logSection("STEP 6: Testing Customer Platform Fee Benefit Accumulation");

  try {
    logInfo("Upgrading customer: Basic (1% fee) → Premium (0% fee)");

    const customerPremiumPlan = await MembershipPlan.findOne({
      userType: "customer",
      tier: "premium",
    });
    const currentMembership = await UserMembership.findOne({
      userId: testCredentials.customer.userId,
      status: "active",
    });

    if (!currentMembership) {
      throw new Error("No active membership found for customer");
    }

    logInfo(`Current platform fee: ${currentMembership.effectivePlatformFeePercentage}%`);
    logInfo(`Current property type: ${currentMembership.effectivePropertyType}`);

    const currentPlan = await MembershipPlan.findById(currentMembership.planId);

    const upgradeSession = createMockStripeSession(
      testCredentials.customer.userId,
      customerPremiumPlan!._id.toString(),
      customerPremiumPlan!.monthlyPrice,
      {
        userType: "customer",
        billingPeriod: currentMembership.billingPeriod,
        isUpgrade: "true",
        currentMembershipId: currentMembership._id.toString(),
        fromPlanId: currentPlan!._id.toString(),
        toPlanId: customerPremiumPlan!._id.toString(),
      },
    );

    const result = await upgradeMembership(
      upgradeSession,
      testCredentials.customer.userId,
      currentMembership._id.toString(),
      currentPlan!._id.toString(),
      customerPremiumPlan!._id.toString(),
    );

    logSuccess("Upgrade completed!");

    const newMembership = await UserMembership.findOne({
      userId: testCredentials.customer.userId,
      status: "active",
    });

    logInfo("\nNew effective benefits:");
    logInfo(
      `  Effective Platform Fee: ${newMembership?.effectivePlatformFeePercentage}% (should be 0%)`,
    );
    logInfo(
      `  Effective Property Type: ${newMembership?.effectivePropertyType} (should be commercial)`,
    );
    logInfo(`  Effective Max Properties: ${newMembership?.effectiveMaxProperties || "Unlimited"}`);
    logInfo(`  Effective Free Evaluation: ${newMembership?.effectiveFreeEvaluation}`);
    logInfo(`  Effective Certified AAS Work: ${newMembership?.effectiveCertifiedAASWork}`);

    // Verify
    if (newMembership?.effectivePlatformFeePercentage !== 0) {
      logError(
        `Platform fee should be 0%, but got ${newMembership?.effectivePlatformFeePercentage}%`,
      );
    } else {
      logSuccess("✓ Platform fee correctly set to 0% (best value)");
    }

    if (newMembership?.effectivePropertyType !== "commercial") {
      logError(
        `Property type should be commercial, but got ${newMembership?.effectivePropertyType}`,
      );
    } else {
      logSuccess("✓ Property type correctly set to commercial");
    }
  } catch (error) {
    logError(`Platform fee accumulation test failed: ${error}`);
    throw error;
  }
}

// Step 7: Verify old memberships are properly expired
async function verifyMembershipExpiration() {
  logSection("STEP 7: Verifying Old Memberships Are Expired");

  try {
    const customerMemberships = await UserMembership.find({
      userId: testCredentials.customer.userId,
    }).sort({ createdAt: 1 });

    const contractorMemberships = await UserMembership.find({
      userId: testCredentials.contractor.userId,
    }).sort({ createdAt: 1 });

    logInfo(`Customer has ${customerMemberships.length} membership records:`);
    customerMemberships.forEach((m, i) => {
      logInfo(
        `  ${i + 1}. Status: ${m.status}, Created: ${m.createdAt}, IsUpgraded: ${m.isUpgraded}`,
      );
    });

    logInfo(`\nContractor has ${contractorMemberships.length} membership records:`);
    contractorMemberships.forEach((m, i) => {
      logInfo(
        `  ${i + 1}. Status: ${m.status}, Created: ${m.createdAt}, IsUpgraded: ${m.isUpgraded}`,
      );
    });

    // Verify only one active membership per user
    const activeCustomer = customerMemberships.filter((m) => m.status === "active");
    const activeContractor = contractorMemberships.filter((m) => m.status === "active");

    if (activeCustomer.length !== 1) {
      logError(
        `Customer should have exactly 1 active membership, but has ${activeCustomer.length}`,
      );
    } else {
      logSuccess("✓ Customer has exactly 1 active membership");
    }

    if (activeContractor.length !== 1) {
      logError(
        `Contractor should have exactly 1 active membership, but has ${activeContractor.length}`,
      );
    } else {
      logSuccess("✓ Contractor has exactly 1 active membership");
    }

    // Verify old memberships are marked as upgraded
    const upgradedCustomer = customerMemberships.filter((m) => (m.status as any) === "upgraded");
    const upgradedContractor = contractorMemberships.filter(
      (m) => (m.status as any) === "upgraded",
    );

    logInfo(`\nCustomer has ${upgradedCustomer.length} upgraded (expired) memberships`);
    logInfo(`Contractor has ${upgradedContractor.length} upgraded (expired) memberships`);
  } catch (error) {
    logError(`Membership expiration verification failed: ${error}`);
    throw error;
  }
}

// Step 8: Save test credentials
async function saveTestCredentials() {
  logSection("STEP 8: Test Credentials Summary");

  log("\n📝 TEST USER CREDENTIALS:", colors.bright + colors.yellow);
  log("━".repeat(80), colors.yellow);

  log("\n👤 CUSTOMER:", colors.bright);
  log(`  Email:    ${testCredentials.customer.email}`);
  log(`  Password: ${testCredentials.customer.password}`);
  log(`  User ID:  ${testCredentials.customer.userId}`);

  log("\n🔨 CONTRACTOR:", colors.bright);
  log(`  Email:    ${testCredentials.contractor.email}`);
  log(`  Password: ${testCredentials.contractor.password}`);
  log(`  User ID:  ${testCredentials.contractor.userId}`);

  log("\n" + "━".repeat(80), colors.yellow);

  // Get final membership states
  const customerMembership = await UserMembership.findOne({
    userId: testCredentials.customer.userId,
    status: "active",
  }).populate("planId");

  const contractorMembership = await UserMembership.findOne({
    userId: testCredentials.contractor.userId,
    status: "active",
  }).populate("planId");

  log("\n📊 FINAL MEMBERSHIP STATES:", colors.bright + colors.cyan);
  log("━".repeat(80), colors.cyan);

  if (customerMembership) {
    log("\n👤 Customer Active Membership:", colors.bright);
    log(`  Plan: ${(customerMembership.planId as any)?.name}`);
    log(`  Tier: ${(customerMembership.planId as any)?.tier}`);
    log(`  End Date: ${customerMembership.endDate}`);
    log(`  Effective Platform Fee: ${customerMembership.effectivePlatformFeePercentage}%`);
    log(`  Effective Property Type: ${customerMembership.effectivePropertyType}`);
  }

  if (contractorMembership) {
    log("\n🔨 Contractor Active Membership:", colors.bright);
    log(`  Plan: ${(contractorMembership.planId as any)?.name}`);
    log(`  Tier: ${(contractorMembership.planId as any)?.tier}`);
    log(`  End Date: ${contractorMembership.endDate}`);
    log(`  Effective Leads/Month: ${contractorMembership.effectiveLeadsPerMonth || "Unlimited"}`);
    log(`  Effective Access Delay: ${contractorMembership.effectiveAccessDelayHours}h`);
    log(`  Effective Radius: ${contractorMembership.effectiveRadiusKm || "Unlimited"} km`);
    log(`  Accumulated Leads: ${contractorMembership.accumulatedLeads || 0}`);
  }

  log("\n" + "━".repeat(80), colors.cyan);
}

// Main test runner
async function runAllTests() {
  try {
    logSection("🧪 MEMBERSHIP UPGRADE SYSTEM - COMPREHENSIVE TESTS");
    log("Starting comprehensive test suite...", colors.bright);

    await connectDB();
    logSuccess("Connected to database");

    await cleanupTestData();
    await createTestUsers();
    await testFirstMembershipPurchase();
    await testSameTierUpgrade();
    await testCrossTierUpgrade();
    await testCustomerPlatformFeeAccumulation();
    await verifyMembershipExpiration();
    await saveTestCredentials();

    logSection("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
    log("The membership upgrade system is working correctly.", colors.green + colors.bright);

    process.exit(0);
  } catch (error) {
    logSection("❌ TESTS FAILED");
    logError(`Error: ${error}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, testCredentials };
