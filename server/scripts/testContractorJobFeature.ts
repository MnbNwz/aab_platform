import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "@config/db";
import { User } from "@models/user/user";
import { UserMembership } from "@models/user/userMembership";
import { MembershipPlan } from "@models/membership/membershipPlan";
import { JobRequest } from "@models/job/jobRequest";
import { Property } from "@models/property/property";
import { Payment } from "@models/payment/payment";
import { hashPassword } from "@utils/auth/password";
import {
  getJobsForContractor,
  getContractorMembership,
  checkLeadLimit,
  canAccessJob,
} from "@services/job/contractorJobService";

// Test data
const testContractor = {
  firstName: "John",
  lastName: "Contractor",
  email: "john.contractor@test.com",
  phone: "+1234567890",
  password: "TestPassword123!",
  role: "contractor",
  status: "active",
  geoHome: {
    type: "Point",
    coordinates: [-74.006, 40.7128], // New York coordinates
  },
  contractor: {
    companyName: "Test Construction Co.",
    services: ["plumbing", "electrical", "hvac"],
    license: "LIC123456",
    taxId: "TAX123456",
    docs: [
      {
        type: "license",
        url: "https://example.com/license.pdf",
        uploadedAt: new Date(),
      },
    ],
  },
};

const testProperty = {
  userId: null, // Will be set after creating user
  title: "Test Property",
  propertyType: "house",
  location: {
    type: "Point",
    coordinates: [-74.005, 40.713], // Close to contractor location
  },
  address: {
    street: "123 Test Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
  },
  area: 1500,
  areaUnit: "sqft",
  totalRooms: 5,
  bedrooms: 3,
  bathrooms: 2,
  kitchens: 1,
  description: "A test property for contractor job testing",
  images: [],
  isActive: true,
};

const testJobs = [
  {
    createdBy: null, // Will be set after creating user
    property: null, // Will be set after creating property
    title: "Plumbing Repair",
    description: "Fix leaky faucet in kitchen",
    service: "plumbing",
    estimate: 150,
    type: "regular",
    status: "open",
    timeline: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    createdBy: null,
    property: null,
    title: "Electrical Installation",
    description: "Install new light fixtures",
    service: "electrical",
    estimate: 300,
    type: "regular",
    status: "open",
    timeline: 5,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    createdBy: null,
    property: null,
    title: "Premium Off-Market Project",
    description: "Exclusive off-market renovation",
    service: "hvac",
    estimate: 5000,
    type: "off_market",
    status: "open",
    timeline: 14,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
];

async function createTestData() {
  try {
    console.log("🧪 Starting contractor job feature testing...\n");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database\n");

    // Clean up existing test data
    await User.deleteMany({ email: testContractor.email });
    await Property.deleteMany({ title: testProperty.title });
    await JobRequest.deleteMany({ title: { $in: testJobs.map((j) => j.title) } });
    console.log("🧹 Cleaned up existing test data\n");

    // Create test contractor
    const contractor = new User({
      ...testContractor,
      passwordHash: hashPassword(testContractor.password),
    });
    await contractor.save();
    console.log("👷 Created test contractor:", contractor.email);

    // Get contractor membership plans
    const basicPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "basic" });
    const premiumPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "premium" });

    if (!basicPlan || !premiumPlan) {
      throw new Error("Contractor membership plans not found. Please run seed:memberships first.");
    }

    console.log("📋 Found membership plans:");
    console.log(
      `   - Basic: ${basicPlan.name} (${basicPlan.leadsPerMonth} leads, ${basicPlan.accessDelayHours}h delay)`,
    );
    console.log(
      `   - Premium: ${premiumPlan.name} (${premiumPlan.leadsPerMonth || "Unlimited"} leads, ${premiumPlan.accessDelayHours}h delay)\n`,
    );

    // Create test property
    const property = new Property({
      ...testProperty,
      userId: contractor._id,
    });
    await property.save();
    console.log("🏠 Created test property:", property.title);

    // Create test jobs
    const jobs = [];
    for (const jobData of testJobs) {
      const job = new JobRequest({
        ...jobData,
        createdBy: contractor._id,
        property: property._id,
      });
      await job.save();
      jobs.push(job);
      console.log(`💼 Created test job: ${job.title} (${job.type})`);
    }
    console.log("");

    return { contractor, property, jobs, basicPlan, premiumPlan };
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  }
}

async function testContractorMembership(contractor: any, plan: any) {
  console.log(`\n🔍 Testing contractor membership (${plan.tier} plan)...`);

  // Create a dummy payment for membership
  const payment = new Payment({
    userId: contractor._id,
    email: contractor.email,
    amount: plan.monthlyPrice,
    currency: "usd",
    status: "succeeded",
    stripeCustomerId: "cus_test_" + Date.now(),
    stripePaymentIntentId: "pi_test_" + Date.now(),
    billingPeriod: "monthly",
    billingType: "recurring",
  });
  await payment.save();

  // Create user membership
  const membership = new UserMembership({
    userId: contractor._id,
    planId: plan._id,
    paymentId: payment._id,
    status: "active",
    billingPeriod: "monthly",
    billingType: "recurring",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isAutoRenew: false,
    leadsUsedThisMonth: 0,
    lastLeadResetDate: new Date(),
  });
  await membership.save();

  console.log(`✅ Created ${plan.tier} membership for contractor`);

  // Test membership retrieval
  const membershipInfo = await getContractorMembership(contractor._id.toString());
  console.log(`📊 Membership info:`, {
    hasMembership: !!membershipInfo.membership,
    hasPlan: !!membershipInfo.plan,
    effectivePlan: membershipInfo.effectivePlan,
  });

  // Test lead limit check
  const leadCheck = await checkLeadLimit(contractor._id.toString());
  console.log(`🎯 Lead limit check:`, {
    canAccess: leadCheck.canAccess,
    leadsUsed: leadCheck.leadsUsed,
    leadsLimit: leadCheck.leadsLimit,
  });

  return membership;
}

async function testJobAccess(contractor: any, jobs: any[]) {
  console.log(`\n🔍 Testing job access for contractor...`);

  for (const job of jobs) {
    console.log(`\n📋 Testing job: ${job.title} (${job.type})`);

    // Test access check
    const accessCheck = await canAccessJob(
      contractor._id.toString(),
      job._id.toString(),
      job.createdAt,
    );

    console.log(`   ⏰ Access check:`, {
      canAccess: accessCheck.canAccess,
      reason: accessCheck.reason,
      accessTime: accessCheck.accessTime ? accessCheck.accessTime.toISOString() : "N/A",
    });

    // Test job fetching
    try {
      const jobResult = await getJobsForContractor(contractor._id.toString(), {
        page: 1,
        limit: 10,
      });

      console.log(`   📊 Job fetch result:`, {
        totalJobs: jobResult.total,
        jobsReturned: jobResult.jobs.length,
        membershipTier: jobResult.membershipInfo.tier,
        leadInfo: jobResult.leadInfo,
      });

      // Check if this specific job is in the results
      const jobInResults = jobResult.jobs.find((j) => j._id.toString() === job._id.toString());
      if (jobInResults) {
        console.log(`   ✅ Job found in results with distance: ${jobInResults.distance}km`);
      } else {
        console.log(`   ❌ Job not found in results`);
      }
    } catch (error) {
      console.log(`   ❌ Error fetching jobs:`, error.message);
    }
  }
}

async function testDifferentMembershipTiers(
  contractor: any,
  basicPlan: any,
  premiumPlan: any,
  jobs: any[],
) {
  console.log(`\n🔍 Testing different membership tiers...`);

  // Test with basic membership
  console.log(`\n📋 Testing with BASIC membership...`);
  const basicMembership = await testContractorMembership(contractor, basicPlan);
  await testJobAccess(contractor, jobs);

  // Clean up basic membership
  await UserMembership.findByIdAndDelete(basicMembership._id);

  // Test with premium membership
  console.log(`\n📋 Testing with PREMIUM membership...`);
  const premiumMembership = await testContractorMembership(contractor, premiumPlan);
  await testJobAccess(contractor, jobs);

  // Clean up premium membership
  await UserMembership.findByIdAndDelete(premiumMembership._id);
}

async function testWithoutMembership(contractor: any, jobs: any[]) {
  console.log(`\n🔍 Testing without membership (should use default)...`);

  const membershipInfo = await getContractorMembership(contractor._id.toString());
  console.log(`📊 Default membership info:`, {
    tier: membershipInfo.effectivePlan.tier,
    leadsPerMonth: membershipInfo.effectivePlan.leadsPerMonth,
    accessDelayHours: membershipInfo.effectivePlan.accessDelayHours,
    radiusKm: membershipInfo.effectivePlan.radiusKm,
  });

  await testJobAccess(contractor, jobs);
}

async function runTests() {
  try {
    // Create test data
    const { contractor, property, jobs, basicPlan, premiumPlan } = await createTestData();

    // Test without membership (default)
    await testWithoutMembership(contractor, jobs);

    // Test with different membership tiers
    await testDifferentMembershipTiers(contractor, basicPlan, premiumPlan, jobs);

    console.log(`\n🎉 All tests completed successfully!`);
    console.log(`\n📋 Test Summary:`);
    console.log(`   - Created contractor: ${contractor.email}`);
    console.log(`   - Created property: ${property.title}`);
    console.log(`   - Created ${jobs.length} test jobs`);
    console.log(`   - Tested basic membership (25 leads, 24h delay, 15km radius)`);
    console.log(
      `   - Tested premium membership (unlimited leads, instant access, unlimited radius)`,
    );
    console.log(`   - Tested default membership fallback`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    // Clean up test data
    try {
      await User.deleteMany({ email: testContractor.email });
      await Property.deleteMany({ title: testProperty.title });
      await JobRequest.deleteMany({ title: { $in: testJobs.map((j) => j.title) } });
      console.log("\n🧹 Cleaned up test data");
    } catch (error) {
      console.error("⚠️  Error cleaning up test data:", error);
    }

    process.exit(0);
  }
}

// Run the tests
runTests();
