import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/db";
import { User, UserMembership } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { hashPassword } from "@utils/auth/password";
import { createNewMembership, upgradeMembership } from "@services/payment/webhook";
import crypto from "crypto";

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function createMockSession(userId: string, planId: string, amount: number, metadata: any) {
  return {
    id: `cs_test_${crypto.randomBytes(16).toString("hex")}`,
    customer: `cus_test_${crypto.randomBytes(8).toString("hex")}`,
    customer_email: metadata.email || "test@example.com",
    payment_intent: `pi_test_${crypto.randomBytes(16).toString("hex")}`,
    amount_total: amount,
    currency: "usd",
    metadata: {
      userId,
      planId,
      billingPeriod: metadata.billingPeriod,
      ...metadata,
    },
  } as any;
}

async function testBillingPeriodUpgrade() {
  try {
    log("\n" + "=".repeat(80), colors.cyan + colors.bold);
    log("  TESTING: Monthly → Yearly Upgrade (Lead Accumulation)", colors.cyan + colors.bold);
    log("=".repeat(80) + "\n", colors.cyan + colors.bold);

    await connectDB();
    log("✅ Connected to database", colors.green);

    // Create test contractor
    const email = `test-leads-${Date.now()}@example.com`;
    const contractor = await User.create({
      firstName: "Lead",
      lastName: "Tester",
      email,
      phone: "+15559999999",
      passwordHash: hashPassword("TestPass123!"),
      role: "contractor",
      status: "active",
      geoHome: { type: "Point", coordinates: [-122.4194, 37.7749] },
      contractor: {
        companyName: "Lead Test Inc",
        services: ["Plumbing"],
        license: "TEST-123",
        taxId: "TAX-123",
        docs: [],
        experience: 3,
        isApproved: true,
      },
    });

    log(`✅ Created test contractor: ${email}`, colors.green);
    log(`   User ID: ${contractor._id}\n`);

    // Get Basic contractor plan
    const basicPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "basic" });
    if (!basicPlan) throw new Error("Basic plan not found");

    log("STEP 1: Purchase Basic Monthly Plan", colors.yellow);
    log(`   Leads per month: ${basicPlan.leadsPerMonth}`);
    log(`   Billing: Monthly`);
    log(`   Expected total leads: ${basicPlan.leadsPerMonth} (for 1 month)\n`);

    const monthlySession = createMockSession(
      contractor._id.toString(),
      basicPlan._id.toString(),
      basicPlan.monthlyPrice,
      { email, billingPeriod: "monthly" },
    );

    await createNewMembership(
      monthlySession,
      contractor._id.toString(),
      basicPlan._id.toString(),
      "monthly",
    );

    let membership = await UserMembership.findOne({
      userId: contractor._id,
      status: "active",
    });

    log("✅ Monthly membership created:", colors.green);
    log(`   Effective Leads/Month: ${membership?.effectiveLeadsPerMonth}`);
    log(`   Accumulated Leads: ${membership?.accumulatedLeads || "N/A"}`);
    log(`   Leads Used: 0`);
    log(`   Leads Remaining: ${membership?.effectiveLeadsPerMonth}\n`);

    log("STEP 2: Upgrade to Basic Yearly (same tier, different billing)", colors.yellow);
    log(`   Leads per month: ${basicPlan.leadsPerMonth}`);
    log(`   Billing: Yearly`);
    log(
      `   Expected total leads for year: ${basicPlan.leadsPerMonth} * 12 = ${basicPlan.leadsPerMonth! * 12}`,
    );
    log(`   Bonus from monthly: ${membership?.effectiveLeadsPerMonth} (unused)`);
    log(
      `   Expected accumulated: ${membership?.effectiveLeadsPerMonth} + ${basicPlan.leadsPerMonth! * 12} = ${membership?.effectiveLeadsPerMonth! + basicPlan.leadsPerMonth! * 12}\n`,
    );

    const yearlySession = createMockSession(
      contractor._id.toString(),
      basicPlan._id.toString(),
      basicPlan.yearlyPrice,
      {
        email,
        billingPeriod: "yearly", // NEW billing period
        isUpgrade: "true",
        currentMembershipId: membership?._id.toString(),
        fromPlanId: basicPlan._id.toString(),
        toPlanId: basicPlan._id.toString(),
      },
    );

    const result = await upgradeMembership(
      yearlySession,
      contractor._id.toString(),
      membership!._id.toString(),
      basicPlan._id.toString(),
      basicPlan._id.toString(),
    );

    const newMembership = await UserMembership.findOne({
      userId: contractor._id,
      status: "active",
    });

    log("✅ Yearly membership created:", colors.green);
    log(`   Billing Period: ${newMembership?.billingPeriod}`);
    log(`   Effective Leads/Month: ${newMembership?.effectiveLeadsPerMonth}`);
    log(`   Accumulated Leads: ${newMembership?.accumulatedLeads}`);
    log(`   Bonus Leads: ${newMembership?.bonusLeadsFromUpgrade}\n`);

    // Verify
    const expected = 25 + 25 * 12; // 25 bonus + 300 yearly = 325
    const actual = newMembership?.accumulatedLeads || 0;

    if (actual === expected) {
      log(`✅ SUCCESS: Leads accumulated correctly!`, colors.green + colors.bold);
      log(`   Expected: ${expected} leads`, colors.green);
      log(`   Actual: ${actual} leads`, colors.green);
    } else {
      log(`❌ FAILED: Lead accumulation incorrect!`, colors.red + colors.bold);
      log(`   Expected: ${expected} leads`, colors.red);
      log(`   Actual: ${actual} leads`, colors.red);
      log(`   Difference: ${actual - expected} leads`, colors.red);
    }

    log("\n" + "=".repeat(80), colors.cyan);
    log("Test Complete", colors.cyan + colors.bold);
    log("=".repeat(80) + "\n", colors.cyan);

    process.exit(actual === expected ? 0 : 1);
  } catch (error) {
    log(`\n❌ Test failed: ${error}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  testBillingPeriodUpgrade();
}
