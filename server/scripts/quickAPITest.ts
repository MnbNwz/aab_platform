import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/db";
import { User } from "@models/user/user";
import { UserMembership } from "@models/user/userMembership";
import { MembershipPlan } from "@models/membership/membershipPlan";
import { JobRequest } from "@models/job/jobRequest";
import { Property } from "@models/property/property";
import { Payment } from "@models/payment/payment";
import { hashPassword, generateAccessToken } from "@utils/auth/password";

async function createTestData() {
  await connectDB();
  console.log("✅ Connected to database");

  // Clean up
  await User.deleteMany({ email: "test.contractor@api.com" });
  await Property.deleteMany({ title: "Quick Test Property" });
  await JobRequest.deleteMany({ title: "Quick Test Job" });

  // Create contractor
  const contractor = new User({
    firstName: "Test",
    lastName: "Contractor",
    email: "test.contractor@api.com",
    phone: "+1234567890",
    passwordHash: hashPassword("TestPassword123!"),
    role: "contractor",
    status: "active",
    geoHome: {
      type: "Point",
      coordinates: [-74.006, 40.7128],
    },
    contractor: {
      companyName: "Test Co",
      services: ["plumbing"],
      license: "LIC123",
      taxId: "TAX123",
      docs: [{ type: "license", url: "test.pdf", uploadedAt: new Date() }],
    },
  });
  await contractor.save();
  console.log("👷 Created contractor:", contractor.email);

  // Get basic plan
  const basicPlan = await MembershipPlan.findOne({ userType: "contractor", tier: "basic" });

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
    startDate: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isAutoRenew: false,
    leadsUsedThisMonth: 0,
    lastLeadResetDate: new Date(),
  });
  await membership.save();

  // Create property
  const property = new Property({
    userId: contractor._id,
    title: "Quick Test Property",
    propertyType: "house",
    location: { type: "Point", coordinates: [-74.005, 40.713] },
    address: {
      street: "123 Test St",
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
    description: "Test property",
    images: [],
    isActive: true,
  });
  await property.save();

  // Create job
  const job = new JobRequest({
    createdBy: contractor._id,
    property: property._id,
    title: "Quick Test Job",
    description: "Test job",
    service: "plumbing",
    estimate: 150,
    type: "regular",
    status: "open",
    timeline: 3,
    bids: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  });
  await job.save();

  // Generate token
  const accessToken = generateAccessToken(contractor._id.toString(), contractor.role);

  console.log("\n🎯 Test Data Ready!");
  console.log(`Contractor ID: ${contractor._id}`);
  console.log(`Job ID: ${job._id}`);
  console.log(`Access Token: ${accessToken}`);

  console.log("\n🔗 Test Commands:");
  console.log(
    `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs`,
  );
  console.log(
    `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs/${job._id}/access`,
  );
  console.log(
    `curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/job/contractor/jobs/${job._id}`,
  );

  process.exit(0);
}

createTestData().catch(console.error);
