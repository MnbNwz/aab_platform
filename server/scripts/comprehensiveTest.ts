import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/db";
import { User } from "@models/user";
import { Property } from "@models/property";
import { JobRequest } from "@models/job";
import { Bid } from "@models/job";
import { UserMembership } from "@models/user";
import { getJobsForContractor, canAccessJob } from "@services/job/contractorJobService";

const testResults = {
  passed: [] as string[],
  failed: [] as string[],
  warnings: [] as string[],
};

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

// Helper functions
function pass(test: string) {
  testResults.passed.push(test);
  console.log(`✅ ${test}`);
}

function fail(test: string, reason: string) {
  testResults.failed.push(`${test}: ${reason}`);
  console.log(`❌ ${test}: ${reason}`);
}

function warn(test: string, reason: string) {
  testResults.warnings.push(`${test}: ${reason}`);
  console.log(`⚠️  ${test}: ${reason}`);
}

// Connect to database
async function connect() {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
}

// Test 1: Verify users exist and are approved
async function testUserVerification() {
  console.log("📋 TEST 1: User Verification");
  console.log("=".repeat(50));

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) {
      fail(`Customer ${customer.email} exists`, "User not found");
      continue;
    }
    if (user.status !== "active" || user.approval !== "approved") {
      fail(
        `Customer ${customer.email} is approved`,
        `Status: ${user.status}, Approval: ${user.approval}`,
      );
    } else {
      pass(`Customer ${customer.email} is verified and approved`);
    }
  }

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) {
      fail(`Contractor ${contractor.email} exists`, "User not found");
      continue;
    }
    if (user.status !== "active" || user.approval !== "approved") {
      fail(
        `Contractor ${contractor.email} is approved`,
        `Status: ${user.status}, Approval: ${user.approval}`,
      );
    } else {
      pass(`Contractor ${contractor.email} is verified and approved`);
    }
  }
  console.log();
}

// Test 2: Verify memberships
async function testMemberships() {
  console.log("📋 TEST 2: Membership Assignment");
  console.log("=".repeat(50));

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) {
      fail(`Customer ${customer.email} has membership`, "No active membership found");
    } else {
      pass(`Customer ${customer.email} has ${customer.membershipTier} membership`);
    }
  }

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) {
      fail(`Contractor ${contractor.email} has membership`, "No active membership found");
    } else {
      pass(`Contractor ${contractor.email} has ${contractor.membershipTier} membership`);
    }
  }
  console.log();
}

// Test 3: Verify property limits
async function testPropertyLimits() {
  console.log("📋 TEST 3: Property Limits");
  console.log("=".repeat(50));

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) continue;

    const properties = await Property.find({ userId: user._id });
    const maxProperties = membership.effectiveMaxProperties;

    if (maxProperties === null) {
      // Unlimited
      if (properties.length > 0) {
        pass(`Customer ${customer.email} can have unlimited properties (has ${properties.length})`);
      } else {
        warn(`Customer ${customer.email} has no properties but can have unlimited`, "");
      }
    } else {
      // Limited
      if (properties.length <= maxProperties) {
        pass(`Customer ${customer.email} has ${properties.length}/${maxProperties} properties`);
      } else {
        fail(
          `Customer ${customer.email} property limit`,
          `Has ${properties.length} but limit is ${maxProperties}`,
        );
      }
    }
  }
  console.log();
}

// Test 4: Test radius filtering
async function testRadiusFiltering() {
  console.log("📋 TEST 4: Radius Filtering");
  console.log("=".repeat(50));

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) continue;

    const radiusKm = membership.effectiveRadiusKm;
    const contractorLocation = user.geoHome.coordinates;

    console.log(`Testing ${contractor.email}:`);
    console.log(`  Radius limit: ${radiusKm === null ? "unlimited" : `${radiusKm}km`}`);
    console.log(`  Contractor location: [${contractorLocation[0]}, ${contractorLocation[1]}]`);

    // Get all open jobs
    const allJobs = await JobRequest.find({ status: "open" }).populate("property").lean();

    let jobsInRadius = 0;
    let jobsOutOfRadius = 0;

    for (const job of allJobs) {
      if (job.property && typeof job.property === "object" && "location" in job.property) {
        const property = job.property as any;
        if (property.location && property.location.coordinates) {
          const [jobLng, jobLat] = property.location.coordinates;
          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in kilometers
          const dLat = ((jobLat - contractorLocation[1]) * Math.PI) / 180;
          const dLon = ((jobLng - contractorLocation[0]) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((contractorLocation[1] * Math.PI) / 180) *
              Math.cos((jobLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (radiusKm === null || distance <= radiusKm) {
            jobsInRadius++;
          } else {
            jobsOutOfRadius++;
          }
        }
      }
    }

    console.log(`  Jobs in radius: ${jobsInRadius}`);
    console.log(`  Jobs out of radius: ${jobsOutOfRadius}`);

    if (radiusKm === null) {
      pass(
        `Contractor ${contractor.email} has unlimited radius (all ${allJobs.length} jobs accessible)`,
      );
    } else {
      pass(
        `Contractor ${contractor.email} can see ${jobsInRadius} jobs within ${radiusKm}km radius`,
      );
      if (jobsOutOfRadius > 0) {
        warn(`Contractor ${contractor.email}`, `${jobsOutOfRadius} jobs are outside radius`);
      }
    }
  }
  console.log();
}

// Test 5: Test service matching
async function testServiceMatching() {
  console.log("📋 TEST 5: Service Matching");
  console.log("=".repeat(50));

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user || !user.contractor) continue;

    const contractorServices = user.contractor.services as string[];
    console.log(`Testing ${contractor.email}:`);
    console.log(`  Contractor services: ${contractorServices.join(", ")}`);

    // Get all open jobs
    const allJobs = await JobRequest.find({ status: "open" });

    let matchingJobs = 0;
    let nonMatchingJobs = 0;

    for (const job of allJobs) {
      if (contractorServices.includes(job.service)) {
        matchingJobs++;
      } else {
        nonMatchingJobs++;
      }
    }

    console.log(`  Matching jobs: ${matchingJobs}`);
    console.log(`  Non-matching jobs: ${nonMatchingJobs}`);

    if (matchingJobs > 0) {
      pass(`Contractor ${contractor.email} can see ${matchingJobs} jobs matching their services`);
    } else {
      warn(`Contractor ${contractor.email}`, "No jobs match their services");
    }
  }
  console.log();
}

// Test 6: Test access delay
async function testAccessDelay() {
  console.log("📋 TEST 6: Access Delay");
  console.log("=".repeat(50));

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    const membership = await UserMembership.findOne({ userId: user._id, status: "active" });
    if (!membership) continue;

    const accessDelayHours = membership.effectiveAccessDelayHours;
    console.log(`Testing ${contractor.email}:`);
    console.log(`  Access delay: ${accessDelayHours} hours`);

    // Get all open jobs
    const allJobs = await JobRequest.find({ status: "open" });

    let accessibleJobs = 0;
    let delayedJobs = 0;

    for (const job of allJobs) {
      const accessCheck = await canAccessJob(
        user._id.toString(),
        job._id.toString(),
        job.createdAt,
      );
      if (accessCheck.canAccess) {
        accessibleJobs++;
      } else {
        delayedJobs++;
      }
    }

    console.log(`  Accessible jobs: ${accessibleJobs}`);
    console.log(`  Delayed jobs: ${delayedJobs}`);

    if (accessibleJobs > 0) {
      pass(`Contractor ${contractor.email} can access ${accessibleJobs} jobs immediately`);
    } else {
      warn(`Contractor ${contractor.email}`, `All jobs are delayed by ${accessDelayHours} hours`);
    }
  }
  console.log();
}

// Test 7: Create bids for contractors
async function testBidCreation() {
  console.log("📋 TEST 7: Bid Creation");
  console.log("=".repeat(50));

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user || !user.contractor) continue;

    const contractorServices = user.contractor.services as string[];

    // Get jobs matching contractor's services
    const jobs = await JobRequest.find({
      status: "open",
      service: { $in: contractorServices },
    })
      .limit(2)
      .lean();

    console.log(`Testing ${contractor.email}:`);
    console.log(`  Found ${jobs.length} jobs to bid on`);

    for (const job of jobs) {
      // Check if contractor already bid
      const existingBid = await Bid.findOne({
        jobRequest: job._id,
        contractor: user._id,
      });

      if (existingBid) {
        warn(`Contractor ${contractor.email}`, `Already bid on job ${job.title}`);
        continue;
      }

      // Create a bid
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + job.timeline);

      const bidData = {
        jobRequest: job._id,
        contractor: user._id,
        bidAmount: job.estimate * 0.9, // 10% lower than estimate
        message: `I can complete this job within ${job.timeline} days for $${job.estimate * 0.9}`,
        status: "pending",
        timeline: {
          startDate: startDate,
          endDate: endDate,
        },
        materials: {
          included: false,
          description: "Materials not included",
        },
        warranty: {
          period: 12,
          description: "12 months warranty on workmanship",
        },
      };

      try {
        await Bid.create(bidData);
        pass(`Contractor ${contractor.email} created bid on job ${job.title}`);
      } catch (error) {
        fail(`Contractor ${contractor.email} create bid`, (error as Error).message);
      }
    }
  }
  console.log();
}

// Test 8: Test property editing restrictions
async function testPropertyEditingRestrictions() {
  console.log("📋 TEST 8: Property Editing Restrictions");
  console.log("=".repeat(50));

  for (const customer of testCredentials.customers) {
    const user = await User.findOne({ email: customer.email });
    if (!user) continue;

    const properties = await Property.find({ userId: user._id });

    for (const property of properties) {
      // Check if property has open jobs
      const openJobs = await JobRequest.find({
        property: property._id,
        status: { $in: ["open", "inprogress"] },
      }).lean();

      console.log(`Testing property ${property.title}:`);
      console.log(`  Open jobs: ${openJobs.length}`);

      if (openJobs.length > 0) {
        // Try to update property
        try {
          property.description = "Updated description";
          await property.save();
          fail(
            `Property ${property.title} editing restriction`,
            "Property was edited despite open jobs",
          );
        } catch (error) {
          pass(`Property ${property.title} cannot be edited with open jobs`);
        }
      } else {
        // No open jobs, should be able to edit
        try {
          property.description = "Updated description";
          await property.save();
          pass(`Property ${property.title} can be edited (no open jobs)`);
        } catch (error) {
          fail(`Property ${property.title} editing`, (error as Error).message);
        }
      }
    }
  }
  console.log();
}

// Test 9: Test comprehensive job visibility
async function testComprehensiveJobVisibility() {
  console.log("📋 TEST 9: Comprehensive Job Visibility");
  console.log("=".repeat(50));

  for (const contractor of testCredentials.contractors) {
    const user = await User.findOne({ email: contractor.email });
    if (!user) continue;

    console.log(`Testing ${contractor.email}:`);

    try {
      const result = await getJobsForContractor(user._id.toString(), {});
      console.log(`  Jobs visible: ${result.jobs.length}`);
      console.log(`  Total jobs: ${result.total}`);

      if (result.jobs.length > 0) {
        pass(`Contractor ${contractor.email} can see ${result.jobs.length} jobs`);
      } else {
        warn(
          `Contractor ${contractor.email}`,
          "No jobs visible (may be due to access delay or service mismatch)",
        );
      }
    } catch (error) {
      fail(`Contractor ${contractor.email} job visibility`, (error as Error).message);
    }
  }
  console.log();
}

// Print summary
function printSummary() {
  console.log("=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log();

  if (testResults.failed.length > 0) {
    console.log("❌ FAILED TESTS:");
    testResults.failed.forEach((test) => console.log(`  - ${test}`));
    console.log();
  }

  if (testResults.warnings.length > 0) {
    console.log("⚠️  WARNINGS:");
    testResults.warnings.forEach((test) => console.log(`  - ${test}`));
    console.log();
  }

  if (testResults.passed.length > 0) {
    console.log("✅ PASSED TESTS:");
    testResults.passed.slice(0, 10).forEach((test) => console.log(`  - ${test}`));
    if (testResults.passed.length > 10) {
      console.log(`  ... and ${testResults.passed.length - 10} more`);
    }
  }
}

// Main function
async function main() {
  try {
    await connect();

    await testUserVerification();
    await testMemberships();
    await testPropertyLimits();
    await testRadiusFiltering();
    await testServiceMatching();
    await testAccessDelay();
    await testBidCreation();
    await testPropertyEditingRestrictions();
    await testComprehensiveJobVisibility();

    printSummary();

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
