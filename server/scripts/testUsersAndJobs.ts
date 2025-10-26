import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/db";
import { User } from "@models/user";
import { Property } from "@models/property";
import { JobRequest } from "@models/job";
import { MembershipPlan } from "@models/membership";
import { UserMembership } from "@models/user";
import { hashPassword } from "@utils/auth/password";
import { createInitialVerification } from "@utils/auth/userVerification";

// Test credentials to remember
const testCredentials = {
  customers: [] as any[],
  contractors: [] as any[],
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

// Generate random email
function generateEmail(prefix: string, index: number): string {
  return `${prefix}${index}@devtest.com`;
}

// Generate random phone
function generatePhone(index: number): string {
  return `+123456789${index}`;
}

// Generate random OTP (6 digits)
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create customers
async function createCustomers() {
  console.log("\n📝 Creating customers...");

  const customerData = [
    {
      firstName: "Alice",
      lastName: "Johnson",
      email: generateEmail("customer.basic", 1),
      phone: generatePhone(1),
      role: "customer",
      membershipTier: "basic",
      defaultPropertyType: "domestic",
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      email: generateEmail("customer.standard", 2),
      phone: generatePhone(2),
      role: "customer",
      membershipTier: "standard",
      defaultPropertyType: "commercial",
    },
    {
      firstName: "Charlie",
      lastName: "Brown",
      email: generateEmail("customer.premium", 3),
      phone: generatePhone(3),
      role: "customer",
      membershipTier: "premium",
      defaultPropertyType: "commercial",
    },
  ];

  for (const data of customerData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        console.log(`⚠️  User ${data.email} already exists, skipping...`);
        testCredentials.customers.push({
          email: data.email,
          password: "Test123!@#",
          firstName: data.firstName,
          lastName: data.lastName,
          membershipTier: data.membershipTier,
        });
        continue;
      }

      // Generate OTP
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash: hashPassword("Test123!@#"),
        role: data.role,
        status: "pending",
        approval: "pending",
        geoHome: {
          type: "Point",
          coordinates: [-74.006, 40.7128], // NYC coordinates
        },
        customer: {
          defaultPropertyType: data.defaultPropertyType,
        },
        userVerification: {
          isVerified: false,
          otpCode: otpCode,
          otpExpiresAt: otpExpiresAt,
          lastSentAt: new Date(),
          canResend: true,
          cooldownSeconds: 0,
        },
        stripeCustomerId: null,
        stripeConnectAccountId: null,
        stripeConnectStatus: "pending",
      };

      const user = await User.create(userData);
      console.log(`✅ Created customer: ${data.email} (${data.membershipTier})`);

      testCredentials.customers.push({
        email: data.email,
        password: "Test123!@#",
        firstName: data.firstName,
        lastName: data.lastName,
        membershipTier: data.membershipTier,
        userId: user._id.toString(),
        otpCode: otpCode,
      });
    } catch (error) {
      console.error(`❌ Failed to create customer ${data.email}:`, error);
    }
  }
}

// Create contractors
async function createContractors() {
  console.log("\n🔧 Creating contractors...");

  const contractorData = [
    {
      firstName: "David",
      lastName: "Wilson",
      email: generateEmail("contractor.basic", 1),
      phone: generatePhone(4),
      role: "contractor",
      membershipTier: "basic",
      companyName: "Wilson Construction",
      services: ["plumbing", "electrical"],
      license: "LIC-001",
      taxId: "TAX-001",
    },
    {
      firstName: "Emma",
      lastName: "Davis",
      email: generateEmail("contractor.premium", 2),
      phone: generatePhone(5),
      role: "contractor",
      membershipTier: "premium",
      companyName: "Davis Builders",
      services: ["plumbing", "electrical", "hvac", "roofing"],
      license: "LIC-002",
      taxId: "TAX-002",
    },
  ];

  for (const data of contractorData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        console.log(`⚠️  User ${data.email} already exists, skipping...`);
        testCredentials.contractors.push({
          email: data.email,
          password: "Test123!@#",
          firstName: data.firstName,
          lastName: data.lastName,
          membershipTier: data.membershipTier,
        });
        continue;
      }

      // Generate OTP
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        passwordHash: hashPassword("Test123!@#"),
        role: data.role,
        status: "pending",
        approval: "pending",
        geoHome: {
          type: "Point",
          coordinates: [-74.006, 40.7128], // NYC coordinates
        },
        contractor: {
          companyName: data.companyName,
          services: data.services,
          license: data.license,
          taxId: data.taxId,
          docs: [],
        },
        userVerification: {
          isVerified: false,
          otpCode: otpCode,
          otpExpiresAt: otpExpiresAt,
          lastSentAt: new Date(),
          canResend: true,
          cooldownSeconds: 0,
        },
        stripeCustomerId: null,
        stripeConnectAccountId: null,
        stripeConnectStatus: "pending",
      };

      const user = await User.create(userData);
      console.log(`✅ Created contractor: ${data.email} (${data.membershipTier})`);

      testCredentials.contractors.push({
        email: data.email,
        password: "Test123!@#",
        firstName: data.firstName,
        lastName: data.lastName,
        membershipTier: data.membershipTier,
        userId: user._id.toString(),
        otpCode: otpCode,
      });
    } catch (error) {
      console.error(`❌ Failed to create contractor ${data.email}:`, error);
    }
  }
}

// Verify all users via OTP
async function verifyUsers() {
  console.log("\n🔐 Verifying users via OTP...");

  // Verify customers
  for (const customer of testCredentials.customers) {
    if (customer.otpCode) {
      try {
        const user = await User.findOne({ email: customer.email });
        if (user && !user.userVerification.isVerified) {
          // Simulate OTP verification
          user.userVerification.isVerified = true;
          user.userVerification.otpCode = null;
          user.userVerification.otpExpiresAt = null;
          await user.save();
          console.log(`✅ Verified customer: ${customer.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to verify customer ${customer.email}:`, error);
      }
    }
  }

  // Verify contractors
  for (const contractor of testCredentials.contractors) {
    if (contractor.otpCode) {
      try {
        const user = await User.findOne({ email: contractor.email });
        if (user && !user.userVerification.isVerified) {
          // Simulate OTP verification
          user.userVerification.isVerified = true;
          user.userVerification.otpCode = null;
          user.userVerification.otpExpiresAt = null;
          await user.save();
          console.log(`✅ Verified contractor: ${contractor.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to verify contractor ${contractor.email}:`, error);
      }
    }
  }
}

// Approve all users
async function approveUsers() {
  console.log("\n✅ Approving all users...");

  // Approve customers
  for (const customer of testCredentials.customers) {
    try {
      const user = await User.findOne({ email: customer.email });
      if (user) {
        user.approval = "approved";
        user.status = "active";
        await user.save();
        console.log(`✅ Approved customer: ${customer.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to approve customer ${customer.email}:`, error);
    }
  }

  // Approve contractors
  for (const contractor of testCredentials.contractors) {
    try {
      const user = await User.findOne({ email: contractor.email });
      if (user) {
        user.approval = "approved";
        user.status = "active";
        await user.save();
        console.log(`✅ Approved contractor: ${contractor.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to approve contractor ${contractor.email}:`, error);
    }
  }
}

// Assign memberships to users
async function assignMemberships() {
  console.log("\n💳 Assigning memberships to users...");

  // Get membership plans
  const customerPlans = await MembershipPlan.find({ userType: "customer", isActive: true });
  const contractorPlans = await MembershipPlan.find({ userType: "contractor", isActive: true });

  // Assign memberships to customers
  for (const customer of testCredentials.customers) {
    try {
      const user = await User.findOne({ email: customer.email });
      if (!user) continue;

      const plan = customerPlans.find((p) => p.tier === customer.membershipTier);
      if (!plan) {
        console.log(`⚠️  No plan found for tier: ${customer.membershipTier}`);
        continue;
      }

      // Create a fake payment for testing
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const membershipData = {
        userId: user._id,
        planId: plan._id,
        paymentId: user._id, // Using userId as fake paymentId for testing
        status: "active",
        billingPeriod: "monthly",
        startDate: startDate,
        endDate: endDate,
        isAutoRenew: false,
        leadsUsedThisMonth: 0,
        leadsUsedThisYear: 0,
        lastLeadResetDate: startDate,
        isUpgraded: false,
        upgradeHistory: [],
        // Copy effective benefits from plan
        effectiveMaxProperties: plan.maxProperties,
        effectivePropertyType: plan.propertyType,
        effectivePlatformFeePercentage: plan.platformFeePercentage,
        effectiveFreeCalculators: plan.freeCalculators,
        effectiveUnlimitedRequests: plan.unlimitedRequests,
        effectiveContractorReviewsVisible: plan.contractorReviewsVisible,
        effectivePriorityContractorAccess: plan.priorityContractorAccess,
        effectivePropertyValuationSupport: plan.propertyValuationSupport,
        effectiveCertifiedAASWork: plan.certifiedAASWork,
        effectiveFreeEvaluation: plan.freeEvaluation,
      };

      await UserMembership.create(membershipData);
      console.log(`✅ Assigned ${customer.membershipTier} membership to: ${customer.email}`);
    } catch (error) {
      console.error(`❌ Failed to assign membership to ${customer.email}:`, error);
    }
  }

  // Assign memberships to contractors
  for (const contractor of testCredentials.contractors) {
    try {
      const user = await User.findOne({ email: contractor.email });
      if (!user) continue;

      const plan = contractorPlans.find((p) => p.tier === contractor.membershipTier);
      if (!plan) {
        console.log(`⚠️  No plan found for tier: ${contractor.membershipTier}`);
        continue;
      }

      // Create a fake payment for testing
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const membershipData = {
        userId: user._id,
        planId: plan._id,
        paymentId: user._id, // Using userId as fake paymentId for testing
        status: "active",
        billingPeriod: "monthly",
        startDate: startDate,
        endDate: endDate,
        isAutoRenew: false,
        leadsUsedThisMonth: 0,
        leadsUsedThisYear: 0,
        lastLeadResetDate: startDate,
        isUpgraded: false,
        upgradeHistory: [],
        // Copy effective benefits from plan
        effectiveLeadsPerMonth: plan.leadsPerMonth,
        effectiveAccessDelayHours: plan.accessDelayHours,
        effectiveRadiusKm: plan.radiusKm,
        effectiveFeaturedListing: plan.featuredListing,
        effectiveOffMarketAccess: plan.offMarketAccess,
        effectivePublicityReferences: plan.publicityReferences,
        effectiveVerifiedBadge: plan.verifiedBadge,
        effectiveFinancingSupport: plan.financingSupport,
        effectivePrivateNetwork: plan.privateNetwork,
      };

      await UserMembership.create(membershipData);
      console.log(`✅ Assigned ${contractor.membershipTier} membership to: ${contractor.email}`);
    } catch (error) {
      console.error(`❌ Failed to assign membership to ${contractor.email}:`, error);
    }
  }
}

// Create properties for customers
async function createProperties() {
  console.log("\n🏠 Creating properties for customers...");

  const propertyTypes = ["apartment", "house", "villa"];

  for (const customer of testCredentials.customers) {
    try {
      const user = await User.findOne({ email: customer.email });
      if (!user) continue;

      // Create 2-3 properties per customer
      const numProperties = customer.membershipTier === "basic" ? 1 : 3;

      for (let i = 0; i < numProperties; i++) {
        const propertyData = {
          userId: user._id,
          title: `${customer.firstName}'s ${propertyTypes[i % propertyTypes.length]} ${i + 1}`,
          propertyType: propertyTypes[i % propertyTypes.length],
          location: {
            type: "Point",
            coordinates: [-74.006 + Math.random() * 0.01, 40.7128 + Math.random() * 0.01],
          },
          area: 1000 + Math.random() * 2000,
          areaUnit: "sqft",
          totalRooms: 3 + Math.floor(Math.random() * 5),
          bedrooms: 2 + Math.floor(Math.random() * 3),
          bathrooms: 1 + Math.floor(Math.random() * 3),
          kitchens: 1,
          description: `Beautiful ${propertyTypes[i % propertyTypes.length]} in a great location`,
          images: [],
          isActive: true,
        };

        await Property.create(propertyData);
        console.log(`✅ Created property for ${customer.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create properties for ${customer.email}:`, error);
    }
  }
}

// Create jobs on properties
async function createJobs() {
  console.log("\n💼 Creating jobs on properties...");

  const services = ["plumbing", "electrical", "hvac", "roofing", "painting"];
  const jobTitles = [
    "Fix leaking pipes",
    "Install new electrical outlets",
    "HVAC system maintenance",
    "Roof repair",
    "Interior painting",
  ];

  for (const customer of testCredentials.customers) {
    try {
      const user = await User.findOne({ email: customer.email });
      if (!user) continue;

      // Get customer's properties
      const properties = await Property.find({ userId: user._id });

      for (const property of properties) {
        // Create 1-2 jobs per property
        const numJobs = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < numJobs; i++) {
          const service = services[Math.floor(Math.random() * services.length)];
          const jobData = {
            createdBy: user._id,
            property: property._id,
            title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
            description: `Need ${service} service for this property`,
            service: service,
            estimate: 500 + Math.random() * 2000,
            type: "regular",
            status: "open",
            bids: [],
            paymentStatus: "pending",
            timeline: 7 + Math.floor(Math.random() * 21),
            timelineHistory: [
              {
                status: "open",
                date: new Date(),
                by: user._id,
                description: "Job created",
              },
            ],
            depositPaid: false,
            depositAmount: 0,
            completionPaid: false,
            completionAmount: 0,
          };

          await JobRequest.create(jobData);
          console.log(`✅ Created job for ${customer.email} on property ${property.title}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to create jobs for ${customer.email}:`, error);
    }
  }
}

// Clean up test data
async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");

  // Delete test users
  for (const customer of testCredentials.customers) {
    try {
      await User.deleteOne({ email: customer.email });
      console.log(`✅ Deleted customer: ${customer.email}`);
    } catch (error) {
      console.error(`❌ Failed to delete customer ${customer.email}:`, error);
    }
  }

  for (const contractor of testCredentials.contractors) {
    try {
      await User.deleteOne({ email: contractor.email });
      console.log(`✅ Deleted contractor: ${contractor.email}`);
    } catch (error) {
      console.error(`❌ Failed to delete contractor ${contractor.email}:`, error);
    }
  }

  // Delete associated memberships
  for (const customer of testCredentials.customers) {
    try {
      await UserMembership.deleteMany({ userId: customer.userId });
    } catch (error) {
      // Ignore errors
    }
  }

  for (const contractor of testCredentials.contractors) {
    try {
      await UserMembership.deleteMany({ userId: contractor.userId });
    } catch (error) {
      // Ignore errors
    }
  }

  console.log("✅ Cleanup completed");
}

// Print credentials
function printCredentials() {
  console.log("\n📋 TEST CREDENTIALS:");
  console.log("\n=== CUSTOMERS ===");
  testCredentials.customers.forEach((customer) => {
    console.log(`\n${customer.membershipTier.toUpperCase()}:`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Password: ${customer.password}`);
    console.log(`  Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`  OTP: ${customer.otpCode}`);
  });

  console.log("\n=== CONTRACTORS ===");
  testCredentials.contractors.forEach((contractor) => {
    console.log(`\n${contractor.membershipTier.toUpperCase()}:`);
    console.log(`  Email: ${contractor.email}`);
    console.log(`  Password: ${contractor.password}`);
    console.log(`  Name: ${contractor.firstName} ${contractor.lastName}`);
    console.log(`  OTP: ${contractor.otpCode}`);
  });
}

// Main function
async function main() {
  try {
    await connect();

    // Create users
    await createCustomers();
    await createContractors();

    // Verify users
    await verifyUsers();

    // Approve users
    await approveUsers();

    // Assign memberships
    await assignMemberships();

    // Create properties
    await createProperties();

    // Create jobs
    await createJobs();

    // Print credentials
    printCredentials();

    console.log("\n✅ Test setup completed successfully!");
    console.log("\n⚠️  Remember to run cleanup() to remove test data");
    console.log("\nTo cleanup, uncomment the cleanup() call below");

    // Uncomment to cleanup
    // await cleanup();

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
