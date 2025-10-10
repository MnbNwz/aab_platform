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

function formatDate(date: Date) {
  return date.toISOString().split("T")[0] + " " + date.toISOString().split("T")[1].split(".")[0];
}

function getDaysDiff(date1: Date, date2: Date) {
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
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

async function testDateAccumulation() {
  try {
    log("\n" + "=".repeat(80), colors.cyan + colors.bold);
    log("  TESTING: Date Accumulation During Upgrade", colors.cyan + colors.bold);
    log("=".repeat(80) + "\n", colors.cyan + colors.bold);

    await connectDB();
    log("✅ Connected to database\n", colors.green);

    // Create test contractor
    const email = `test-dates-${Date.now()}@example.com`;
    const contractor = await User.create({
      firstName: "Date",
      lastName: "Tester",
      email,
      phone: "+15559999998",
      passwordHash: hashPassword("TestPass123!"),
      role: "contractor",
      status: "active",
      geoHome: { type: "Point", coordinates: [-122.4194, 37.7749] },
      contractor: {
        companyName: "Date Test Inc",
        services: ["Plumbing"],
        license: "TEST-123",
        taxId: "TAX-123",
        docs: [],
        experience: 3,
        isApproved: true,
      },
    });

    const basicPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "basic" });
    if (!basicPlan) throw new Error("Basic plan not found");

    // STEP 1: Create initial membership
    log("STEP 1: Create Basic Monthly Membership", colors.yellow);
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

    const membership1 = await UserMembership.findOne({
      userId: contractor._id,
      status: "active",
    });

    log(`✅ Initial membership created:`, colors.green);
    log(`   Start Date: ${formatDate(membership1!.startDate)}`);
    log(`   End Date:   ${formatDate(membership1!.endDate)}`);
    const duration1 = getDaysDiff(membership1!.startDate, membership1!.endDate);
    log(`   Duration:   ${duration1} days`);
    log(`   Expected:   ~30 days\n`);

    // Wait a moment and then upgrade
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // STEP 2: Upgrade after 2 seconds (simulates passing time)
    log("STEP 2: Upgrade to Premium Monthly (2 seconds later)", colors.yellow);

    const premiumPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "premium" });
    if (!premiumPlan) throw new Error("Premium plan not found");

    // Refresh membership data
    const currentMembership = await UserMembership.findOne({
      userId: contractor._id,
      status: "active",
    });

    const now = new Date();
    const remainingDays = getDaysDiff(now, currentMembership!.endDate);
    log(`   Current Date: ${formatDate(now)}`);
    log(`   Original Start: ${formatDate(currentMembership!.startDate)}`);
    log(`   Original End: ${formatDate(currentMembership!.endDate)}`);
    log(`   Days Remaining: ${remainingDays}\n`);

    const upgradeSession = createMockSession(
      contractor._id.toString(),
      premiumPlan._id.toString(),
      premiumPlan.monthlyPrice,
      {
        email,
        billingPeriod: "monthly",
        isUpgrade: "true",
        currentMembershipId: currentMembership!._id.toString(),
        fromPlanId: basicPlan._id.toString(),
        toPlanId: premiumPlan._id.toString(),
      },
    );

    await upgradeMembership(
      upgradeSession,
      contractor._id.toString(),
      currentMembership!._id.toString(),
      basicPlan._id.toString(),
      premiumPlan._id.toString(),
    );

    const membership2 = await UserMembership.findOne({
      userId: contractor._id,
      status: "active",
    });

    log(`✅ Upgraded membership:`, colors.green);
    log(`   New Start Date: ${formatDate(membership2!.startDate)}`);
    log(`   New End Date:   ${formatDate(membership2!.endDate)}`);
    const duration2 = getDaysDiff(membership2!.startDate, membership2!.endDate);
    log(`   New Duration:   ${duration2} days`);
    log(`   Expected:       ~${remainingDays + 30} days (${remainingDays} remaining + 30 new)\n`);

    // Verify the duration
    const expectedDuration = remainingDays + 30;
    const tolerance = 1; // Allow 1 day tolerance for rounding

    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", colors.cyan);
    log("VERIFICATION:", colors.bold);
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", colors.cyan);

    log(`Original membership start:  ${formatDate(currentMembership!.startDate)}`);
    log(`Original membership end:    ${formatDate(currentMembership!.endDate)}`);
    log(`Time of upgrade:            ${formatDate(now)}`);
    log(`New membership start:       ${formatDate(membership2!.startDate)}`);
    log(`New membership end:         ${formatDate(membership2!.endDate)}\n`);

    log(
      `Days from original start to original end: ${getDaysDiff(currentMembership!.startDate, currentMembership!.endDate)} days`,
    );
    log(`Days from upgrade time to new end:        ${duration2} days`);
    log(`Expected accumulated days:                 ${expectedDuration} days\n`);

    if (Math.abs(duration2 - expectedDuration) <= tolerance) {
      log(
        `✅ DURATION CORRECT: ${duration2} days (expected ~${expectedDuration})`,
        colors.green + colors.bold,
      );
    } else {
      log(
        `❌ DURATION INCORRECT: ${duration2} days (expected ~${expectedDuration})`,
        colors.red + colors.bold,
      );
    }

    // Verify original start date is preserved
    const timeLost = getDaysDiff(currentMembership!.startDate, membership2!.startDate);

    if (timeLost === 0) {
      log(`\n✅ ORIGINAL START DATE PRESERVED!`, colors.green + colors.bold);
      log(`   Original membership started: ${formatDate(currentMembership!.startDate)}`);
      log(`   New membership starts:       ${formatDate(membership2!.startDate)}`);
      log(`   Time gap:                    ${timeLost} days (PERFECT!)`, colors.green);
      log(`\n   ✨ The original purchase date is maintained across upgrades!`);
      log(`   Users can see when they first became a member.\n`, colors.green);
    } else {
      log(`\n❌ ORIGINAL START DATE NOT PRESERVED!`, colors.red + colors.bold);
      log(`   Original membership started: ${formatDate(currentMembership!.startDate)}`);
      log(`   New membership starts:       ${formatDate(membership2!.startDate)}`);
      log(`   Time gap (lost):             ${timeLost} days`, colors.red);
      log(`\n   The original start date should be preserved during upgrades.\n`, colors.red);
    }

    process.exit(Math.abs(duration2 - expectedDuration) <= tolerance ? 0 : 1);
  } catch (error) {
    log(`\n❌ Test failed: ${error}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  testDateAccumulation();
}
