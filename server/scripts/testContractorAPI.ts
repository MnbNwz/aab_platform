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
import { generateAccessToken } from "@utils/auth/password";

// Test data
const testContractor = {
  firstName: "API",
  lastName: "Tester",
  email: "api.tester@test.com",
  phone: "+1234567890",
  password: "TestPassword123!",
  role: "contractor",
  status: "active",
  geoHome: {
    type: "Point",
    coordinates: [-74.006, 40.7128], // New York coordinates
  },
  contractor: {
    companyName: "API Test Construction Co.",
    services: ["plumbing", "electrical"],
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

async function createTestData() {
  try {
    console.log("🧪 Creating test data for API testing...\n");

    // Connect to database
    await connectDB();
    console.log("✅ Connected to database\n");

    // Clean up existing test data
    await User.deleteMany({ email: testContractor.email });
    await Property.deleteMany({ title: "API Test Property" });
    await JobRequest.deleteMany({ title: { $in: ["API Test Job 1", "API Test Job 2"] } });
    console.log("🧹 Cleaned up existing test data\n");

    // Create test contractor
    const contractor = new User({
      ...testContractor,
      passwordHash: hashPassword(testContractor.password),
    });
    await contractor.save();
    console.log("👷 Created test contractor:", contractor.email);

    // Get basic membership plan
    const basicPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "basic" });
    if (!basicPlan) {
      throw new Error("Basic contractor plan not found. Please run seed:memberships first.");
    }

    // Create payment
    const payment = new Payment({
      userId: contractor._id,
      email: contractor.email,
      amount: basicPlan.monthlyPrice,
      currency: "usd",
      status: "succeeded",
      stripeCustomerId: "cus_test_" + Date.now(),
      stripePaymentIntentId: "pi_test_" + Date.now(),
      billingPeriod: "monthly",
      billingType: "recurring",
    });
    await payment.save();

    // Create membership
    const membership = new UserMembership({
      userId: contractor._id,
      planId: basicPlan._id,
      paymentId: payment._id,
      status: "active",
      billingPeriod: "monthly",
      billingType: "recurring",
      startDate: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago to bypass delay
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isAutoRenew: false,
      leadsUsedThisMonth: 0,
      lastLeadResetDate: new Date(),
    });
    await membership.save();
    console.log("📋 Created basic membership for contractor");

    // Create test property
    const property = new Property({
      userId: contractor._id,
      title: "API Test Property",
      propertyType: "house",
      location: {
        type: "Point",
        coordinates: [-74.005, 40.713], // Close to contractor location
      },
      address: {
        street: "123 API Test Street",
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
      description: "A test property for API testing",
      images: [],
      isActive: true,
    });
    await property.save();
    console.log("🏠 Created test property:", property.title);

    // Create test jobs
    const jobs = [];
    const jobData = [
      {
        title: "API Test Job 1",
        description: "Test job for API testing",
        service: "plumbing",
        estimate: 150,
        type: "regular",
        timeline: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: "API Test Job 2",
        description: "Another test job for API testing",
        service: "electrical",
        estimate: 300,
        type: "regular",
        timeline: 5,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    ];

    for (const jobInfo of jobData) {
      const job = new JobRequest({
        ...jobInfo,
        createdBy: contractor._id,
        property: property._id,
        status: "open",
        bids: [],
      });
      await job.save();
      jobs.push(job);
      console.log(`💼 Created test job: ${job.title}`);
    }

    // Generate access token
    const accessToken = generateAccessToken(contractor._id.toString(), contractor.role);

    console.log("\n🎯 Test data created successfully!");
    console.log("📋 API Testing Information:");
    console.log(`   - Contractor ID: ${contractor._id}`);
    console.log(`   - Access Token: ${accessToken}`);
    console.log(`   - Job IDs: ${jobs.map((j) => j._id).join(", ")}`);
    console.log(`   - Property ID: ${property._id}`);

    console.log("\n🔗 Test these endpoints:");
    console.log(`   GET /api/job/contractor/jobs`);
    console.log(`   GET /api/job/contractor/jobs/${jobs[0]._id}/access`);
    console.log(`   GET /api/job/contractor/jobs/${jobs[0]._id}`);

    console.log("\n📝 Use this Authorization header:");
    console.log(`   Authorization: Bearer ${accessToken}`);

    return { contractor, jobs, property, accessToken };
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  }
}

async function runAPITest() {
  try {
    const { contractor, jobs, accessToken } = await createTestData();

    console.log("\n🧪 API Test Setup Complete!");
    console.log("You can now test the contractor endpoints using the information above.");
    console.log("\n💡 Example curl commands:");
    console.log(
      `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs`,
    );
    console.log(
      `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs/${jobs[0]._id}/access`,
    );
    console.log(
      `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs/${jobs[0]._id}`,
    );
  } catch (error) {
    console.error("❌ API test setup failed:", error);
    process.exit(1);
  }
}

// Run the API test setup
runAPITest();
