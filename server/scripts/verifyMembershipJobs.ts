import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/db";
import { User } from "@models/user";
import { Property } from "@models/property";
import { JobRequest } from "@models/job";
import { UserMembership } from "@models/user";
import { getJobsForContractor } from "@services/job/contractorJobService";

// Test credentials
const testCredentials = {
  customers: [
    { email: "customer.basic1@devtest.com", membershipTier: "basic" },
    { email: "customer.standard2@devtest.com", membershipTier: "standard" },
    { email: "customer.premium3@devtest.com", membershipTier: "premium" },
  ],
  contractors: [
    { email: "contractor.basic1@devtest.com", membershipTier: "basic" },
    { email: "contractor.premium2@devtest.com", membershipTier: "premium" },
  ],
};

// Connect to database
async function connect() {
  try {
    await connectDB();
    console.log("✅ Connected to database");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
}

// Verify users exist and are approved
async function verifyUsers() {
  console.log("\n🔍 Verifying users...");

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) {
      console.log(`❌ Customer not found: ${customer.email}`);
      continue;
    }
    console.log(
      `✅ Customer: ${customer.email} - Status: ${user.status}, Approval: ${user.approval}`,
    );
  }

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) {
      console.log(`❌ Contractor not found: ${contractor.email}`);
      continue;
    }
    console.log(
      `✅ Contractor: ${contractor.email} - Status: ${user.status}, Approval: ${user.approval}`,
    );
  }
}

// Verify properties exist
async function verifyProperties() {
  console.log("\n🏠 Verifying properties...");

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const properties = await Property.find({ userId: user._id });
    console.log(`✅ Customer ${customer.email} has ${properties.length} properties`);
  }
}

// Verify jobs exist
async function verifyJobs() {
  console.log("\n💼 Verifying jobs...");

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const jobs = await JobRequest.find({ createdBy: user._id });
    console.log(`✅ Customer ${customer.email} has ${jobs.length} jobs`);
  }
}

// Verify memberships
async function verifyMemberships() {
  console.log("\n💳 Verifying memberships...");

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (membership) {
      console.log(`✅ Customer ${customer.email} has ${customer.membershipTier} membership`);
    } else {
      console.log(`❌ Customer ${customer.email} has no active membership`);
    }
  }

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (membership) {
      console.log(`✅ Contractor ${contractor.email} has ${contractor.membershipTier} membership`);
    } else {
      console.log(`❌ Contractor ${contractor.email} has no active membership`);
    }
  }
}

// Test job visibility for contractors
async function testJobVisibility() {
  console.log("\n🔍 Testing job visibility for contractors...");

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    console.log(`\n📋 Testing contractor: ${contractor.email} (${contractor.membershipTier})`);

    try {
      const result = await getJobsForContractor(user._id.toString(), {});
      console.log(`  ✅ Found ${result.jobs.length} jobs`);
      console.log(`  📊 Total: ${result.total}, Page: ${result.pagination.page}`);

      if (result.jobs.length > 0) {
        console.log(`  📝 First job: ${result.jobs[0].title}`);
        console.log(`  🔧 Service: ${result.jobs[0].service}`);
      }
    } catch (error) {
      console.error(`  ❌ Error getting jobs:`, error);
    }
  }
}

// Test property limits for customers
async function testPropertyLimits() {
  console.log("\n🏠 Testing property limits for customers...");

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) continue;

    const properties = await Property.find({ userId: user._id });
    const maxProperties = membership.effectiveMaxProperties;

    console.log(`\n📋 Customer: ${customer.email} (${customer.membershipTier})`);
    console.log(`  Properties: ${properties.length}`);
    console.log(`  Max allowed: ${maxProperties === null ? "unlimited" : maxProperties}`);

    if (maxProperties !== null && properties.length > maxProperties) {
      console.log(`  ⚠️  WARNING: Exceeds limit!`);
    } else {
      console.log(`  ✅ Within limits`);
    }
  }
}

// Main function
async function main() {
  try {
    await connect();

    await verifyUsers();
    await verifyProperties();
    await verifyJobs();
    await verifyMemberships();
    await testJobVisibility();
    await testPropertyLimits();

    console.log("\n✅ Verification completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
