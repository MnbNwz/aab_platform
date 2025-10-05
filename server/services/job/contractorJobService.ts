import { Types } from "mongoose";
import { JobRequest } from "@models/job/jobRequest";
import { UserMembership } from "@models/user/userMembership";
import { MembershipPlan } from "@models/membership/membershipPlan";
import { User } from "@models/user/user";
import { Property } from "@models/property/property";
import { LeadAccess } from "@models/job/leadAccess";
import { IUserMembership, IMembershipPlan } from "@models/types/membership";

// Default contractor membership for users without active membership
const DEFAULT_CONTRACTOR_MEMBERSHIP = {
  leadsPerMonth: 25,
  accessDelayHours: 24,
  radiusKm: 15,
  featuredListing: false,
  offMarketAccess: false,
  tier: "basic" as const,
};

// Get contractor's current membership or default
export async function getContractorMembership(userId: string): Promise<{
  membership: IUserMembership | null;
  plan: IMembershipPlan | null;
  effectivePlan: any;
}> {
  try {
    // Get active membership
    const membership = await UserMembership.findOne({
      userId: new Types.ObjectId(userId),
      status: "active",
      endDate: { $gt: new Date() },
    }).populate("planId");

    if (!membership || !membership.planId) {
      // Return default membership for contractors without active membership
      return {
        membership: null,
        plan: null,
        effectivePlan: {
          ...DEFAULT_CONTRACTOR_MEMBERSHIP,
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago as dummy time
        },
      };
    }

    const plan = membership.planId as any as IMembershipPlan;

    // Check if user is contractor
    if (plan.userType !== "contractor") {
      return {
        membership: null,
        plan: null,
        effectivePlan: {
          ...DEFAULT_CONTRACTOR_MEMBERSHIP,
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      };
    }

    return {
      membership: membership as IUserMembership,
      plan,
      effectivePlan: {
        ...plan.toObject(),
        startDate: membership.startDate,
        leadsUsedThisMonth: membership.leadsUsedThisMonth || 0,
        lastLeadResetDate: membership.lastLeadResetDate || membership.startDate,
      },
    };
  } catch (error) {
    console.error("Error getting contractor membership:", error);
    return {
      membership: null,
      plan: null,
      effectivePlan: {
        ...DEFAULT_CONTRACTOR_MEMBERSHIP,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    };
  }
}

// Check if contractor can access a job based on membership
export async function canAccessJob(
  userId: string,
  jobId: string,
  jobCreatedAt: Date,
): Promise<{
  canAccess: boolean;
  reason?: string;
  accessTime?: Date;
}> {
  const { effectivePlan } = await getContractorMembership(userId);

  // Calculate access time based on delay
  const accessTime = new Date(
    jobCreatedAt.getTime() + effectivePlan.accessDelayHours * 60 * 60 * 1000,
  );

  const now = new Date();

  if (now < accessTime) {
    return {
      canAccess: false,
      reason: `Job will be available at ${accessTime.toISOString()}`,
      accessTime,
    };
  }

  return {
    canAccess: true,
    accessTime,
  };
}

// OPTIMIZED: Check lead limit using UserMembership counter + LeadAccess for verification
export async function checkLeadLimit(userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
  leadsUsed: number;
  leadsLimit: number | null;
  remaining?: number;
  resetDate?: Date;
}> {
  const { membership, effectivePlan } = await getContractorMembership(userId);

  // If no limit (unlimited), always allow
  if (effectivePlan.leadsPerMonth === null) {
    return {
      canAccess: true,
      leadsUsed: 0,
      leadsLimit: null,
      remaining: -1, // -1 indicates unlimited
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
  }

  // OPTIMIZATION 1: Use membership billing cycle for lead resets
  const now = new Date();
  const membershipStartDate = new Date(effectivePlan.startDate);
  const lastReset = new Date(effectivePlan.lastLeadResetDate);

  // Calculate if we should reset based on membership billing cycle
  const shouldReset = shouldResetLeadLimits(
    now,
    membershipStartDate,
    lastReset,
    effectivePlan.billingPeriod,
  );

  let leadsUsed = effectivePlan.leadsUsedThisMonth || 0;

  // OPTIMIZATION 2: Only reset counter if billing cycle has passed
  if (shouldReset && membership) {
    // Calculate billing cycle period for lead counting
    const billingPeriod = getBillingPeriodForLeadCount(
      now,
      membershipStartDate,
      effectivePlan.billingPeriod,
    );

    // Verify with LeadAccess count for the billing period
    const actualCount = await LeadAccess.countDocuments({
      contractor: userId,
      accessedAt: {
        $gte: billingPeriod.start,
        $lte: billingPeriod.end,
      },
    });

    // Sync counter with actual count and update reset date
    await UserMembership.findByIdAndUpdate(membership._id, {
      leadsUsedThisMonth: actualCount,
      lastLeadResetDate: now,
    });

    leadsUsed = actualCount;
  }

  // Calculate next reset date based on billing cycle
  const resetDate = getNextBillingResetDate(now, membershipStartDate, effectivePlan.billingPeriod);

  if (leadsUsed >= effectivePlan.leadsPerMonth) {
    return {
      canAccess: false,
      reason: `Monthly lead limit reached (${leadsUsed}/${effectivePlan.leadsPerMonth})`,
      leadsUsed,
      leadsLimit: effectivePlan.leadsPerMonth,
      remaining: 0,
      resetDate,
    };
  }

  return {
    canAccess: true,
    leadsUsed,
    leadsLimit: effectivePlan.leadsPerMonth,
    remaining: Math.max(0, effectivePlan.leadsPerMonth - leadsUsed),
    resetDate,
  };
}

// OPTIMIZED: Determine if lead limits should reset (ultra-precise and fast)
function shouldResetLeadLimits(
  now: Date,
  membershipStartDate: Date,
  lastReset: Date,
  billingPeriod: string,
): boolean {
  // OPTIMIZATION 1: Normalize all dates to UTC milliseconds for precise comparison
  const nowMs = now.getTime();
  const startMs = membershipStartDate.getTime();
  const lastResetMs = lastReset.getTime();

  // OPTIMIZATION 2: Extract time components once and cache
  const startTime = {
    year: membershipStartDate.getUTCFullYear(),
    month: membershipStartDate.getUTCMonth(),
    date: membershipStartDate.getUTCDate(),
    hours: membershipStartDate.getUTCHours(),
    minutes: membershipStartDate.getUTCMinutes(),
    seconds: membershipStartDate.getUTCSeconds(),
    ms: membershipStartDate.getUTCMilliseconds(),
  };

  if (billingPeriod === "yearly") {
    // OPTIMIZATION 3: Calculate anniversaries using cached time components
    const currentAnniversaryMs = getYearlyAnniversaryMs(nowMs, startTime);
    const lastResetAnniversaryMs = getYearlyAnniversaryMs(lastResetMs, startTime);

    return currentAnniversaryMs > lastResetAnniversaryMs;
  } else {
    // OPTIMIZATION 4: Calculate anniversaries using cached time components
    const currentAnniversaryMs = getMonthlyAnniversaryMs(nowMs, startTime);
    const lastResetAnniversaryMs = getMonthlyAnniversaryMs(lastResetMs, startTime);

    return currentAnniversaryMs > lastResetAnniversaryMs;
  }
}

// Type for cached time components (performance optimization)
interface TimeComponents {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  ms: number;
}

// OPTIMIZED: Calculate yearly anniversary in UTC milliseconds (ultra-fast)
function getYearlyAnniversaryMs(dateMs: number, startTime: TimeComponents): number {
  const date = new Date(dateMs);
  const currentYear = date.getUTCFullYear();

  // OPTIMIZATION: Use Date.UTC for precise UTC calculation
  return Date.UTC(
    currentYear,
    startTime.month,
    startTime.date,
    startTime.hours,
    startTime.minutes,
    startTime.seconds,
    startTime.ms,
  );
}

// OPTIMIZED: Calculate monthly anniversary in UTC milliseconds (ultra-fast)
function getMonthlyAnniversaryMs(dateMs: number, startTime: TimeComponents): number {
  const date = new Date(dateMs);
  const currentYear = date.getUTCFullYear();
  const currentMonth = date.getUTCMonth();

  // OPTIMIZATION: Use Date.UTC for precise UTC calculation
  return Date.UTC(
    currentYear,
    currentMonth,
    startTime.date,
    startTime.hours,
    startTime.minutes,
    startTime.seconds,
    startTime.ms,
  );
}

// OPTIMIZED: Calculate billing anniversary with exact time precision (legacy function for compatibility)
function getBillingAnniversary(date: Date, membershipStartDate: Date, billingPeriod: string): Date {
  // OPTIMIZATION: Use cached time components
  const startTime = {
    year: membershipStartDate.getUTCFullYear(),
    month: membershipStartDate.getUTCMonth(),
    date: membershipStartDate.getUTCDate(),
    hours: membershipStartDate.getUTCHours(),
    minutes: membershipStartDate.getUTCMinutes(),
    seconds: membershipStartDate.getUTCSeconds(),
    ms: membershipStartDate.getUTCMilliseconds(),
  };

  if (billingPeriod === "yearly") {
    const anniversaryMs = getYearlyAnniversaryMs(date.getTime(), startTime);
    return new Date(anniversaryMs);
  } else {
    const anniversaryMs = getMonthlyAnniversaryMs(date.getTime(), startTime);
    return new Date(anniversaryMs);
  }
}

// OPTIMIZED: Get billing period boundaries with ultra-precision (fast)
function getBillingPeriodForLeadCount(
  now: Date,
  membershipStartDate: Date,
  billingPeriod: string,
): { start: Date; end: Date } {
  // OPTIMIZATION 1: Cache time components once
  const startTime = {
    year: membershipStartDate.getUTCFullYear(),
    month: membershipStartDate.getUTCMonth(),
    date: membershipStartDate.getUTCDate(),
    hours: membershipStartDate.getUTCHours(),
    minutes: membershipStartDate.getUTCMinutes(),
    seconds: membershipStartDate.getUTCSeconds(),
    ms: membershipStartDate.getUTCMilliseconds(),
  };

  const nowTime = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  };

  if (billingPeriod === "yearly") {
    // OPTIMIZATION 2: Use Date.UTC for precise calculations
    const startOfYearMs = Date.UTC(
      nowTime.year,
      startTime.month,
      startTime.date,
      startTime.hours,
      startTime.minutes,
      startTime.seconds,
      startTime.ms,
    );

    // OPTIMIZATION 3: End 1ms before next anniversary (precise boundary)
    const endOfYearMs =
      Date.UTC(
        nowTime.year + 1,
        startTime.month,
        startTime.date,
        startTime.hours,
        startTime.minutes,
        startTime.seconds,
        startTime.ms,
      ) - 1;

    return {
      start: new Date(startOfYearMs),
      end: new Date(endOfYearMs),
    };
  } else {
    // OPTIMIZATION 4: Use Date.UTC for precise monthly calculations
    const startOfMonthMs = Date.UTC(
      nowTime.year,
      nowTime.month,
      startTime.date,
      startTime.hours,
      startTime.minutes,
      startTime.seconds,
      startTime.ms,
    );

    // OPTIMIZATION 5: Handle month overflow correctly
    const nextMonth = nowTime.month === 11 ? 0 : nowTime.month + 1;
    const nextYear = nowTime.month === 11 ? nowTime.year + 1 : nowTime.year;

    const endOfMonthMs =
      Date.UTC(
        nextYear,
        nextMonth,
        startTime.date,
        startTime.hours,
        startTime.minutes,
        startTime.seconds,
        startTime.ms,
      ) - 1;

    return {
      start: new Date(startOfMonthMs),
      end: new Date(endOfMonthMs),
    };
  }
}

// OPTIMIZED: Calculate next billing reset date with ultra-precision (fast)
function getNextBillingResetDate(
  now: Date,
  membershipStartDate: Date,
  billingPeriod: string,
): Date {
  // OPTIMIZATION 1: Cache time components once
  const startTime = {
    month: membershipStartDate.getUTCMonth(),
    date: membershipStartDate.getUTCDate(),
    hours: membershipStartDate.getUTCHours(),
    minutes: membershipStartDate.getUTCMinutes(),
    seconds: membershipStartDate.getUTCSeconds(),
    ms: membershipStartDate.getUTCMilliseconds(),
  };

  const nowTime = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  };

  if (billingPeriod === "yearly") {
    // OPTIMIZATION 2: Use Date.UTC for precise yearly calculation
    const nextResetMs = Date.UTC(
      nowTime.year + 1,
      startTime.month,
      startTime.date,
      startTime.hours,
      startTime.minutes,
      startTime.seconds,
      startTime.ms,
    );

    return new Date(nextResetMs);
  } else {
    // OPTIMIZATION 3: Handle month overflow correctly with UTC
    const nextMonth = nowTime.month === 11 ? 0 : nowTime.month + 1;
    const nextYear = nowTime.month === 11 ? nowTime.year + 1 : nowTime.year;

    const nextResetMs = Date.UTC(
      nextYear,
      nextMonth,
      startTime.date,
      startTime.hours,
      startTime.minutes,
      startTime.seconds,
      startTime.ms,
    );

    return new Date(nextResetMs);
  }
}

// OPTIMIZED: Increment lead usage counter (fast operation)
export async function incrementLeadUsage(userId: string): Promise<void> {
  const { membership } = await getContractorMembership(userId);

  if (membership) {
    // Fast atomic increment operation
    await UserMembership.findByIdAndUpdate(membership._id, {
      $inc: { leadsUsedThisMonth: 1 },
    });
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Filter jobs by radius
export async function filterJobsByRadius(
  jobs: any[],
  contractorLocation: { lat: number; lng: number },
  radiusKm: number | null,
): Promise<any[]> {
  if (radiusKm === null) {
    return jobs; // Unlimited radius
  }

  const filteredJobs = [];

  for (const job of jobs) {
    if (job.property?.location?.coordinates) {
      const [jobLng, jobLat] = job.property.location.coordinates;
      const distance = calculateDistance(
        contractorLocation.lat,
        contractorLocation.lng,
        jobLat,
        jobLng,
      );

      if (distance <= radiusKm) {
        filteredJobs.push({
          ...job,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        });
      }
    }
  }

  return filteredJobs;
}

// Get contractor's location from user profile
export async function getContractorLocation(userId: string): Promise<{
  lat: number;
  lng: number;
} | null> {
  try {
    const user = await User.findById(userId).select("geoHome");

    if (user?.geoHome?.coordinates) {
      const [lng, lat] = user.geoHome.coordinates;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error("Error getting contractor location:", error);
    return null;
  }
}

// Main function to get jobs for contractor with all filters applied
export async function getJobsForContractor(
  userId: string,
  filters: any = {},
): Promise<{
  jobs: any[];
  total: number;
  pagination: any;
  membershipInfo: any;
  leadInfo: any;
  contractorInfo: any;
}> {
  try {
    const { effectivePlan } = await getContractorMembership(userId);
    const leadCheck = await checkLeadLimit(userId);

    if (!leadCheck.canAccess) {
      // OPTIMIZATION 7: Get contractor data once for early returns
      const contractor = await User.findById(userId).select("contractor.services geoHome");
      const contractorLocation = contractor?.geoHome
        ? {
            lat: contractor.geoHome.coordinates[1],
            lng: contractor.geoHome.coordinates[0],
          }
        : null;

      return {
        jobs: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        membershipInfo: effectivePlan,
        leadInfo: leadCheck,
        contractorInfo: {
          services: contractor?.contractor?.services || [],
          location: contractorLocation,
        },
      };
    }

    // OPTIMIZATION 3: Get contractor data in single query
    const contractor = await User.findById(userId).select("contractor.services geoHome");
    const contractorLocation = contractor?.geoHome
      ? {
          lat: contractor.geoHome.coordinates[1],
          lng: contractor.geoHome.coordinates[0],
        }
      : null;

    // Build base query
    const query: any = {
      status: "open",
    };

    // Filter out off-market jobs if contractor doesn't have access
    if (!effectivePlan.offMarketAccess) {
      query.type = { $ne: "off_market" };
    }

    // ENHANCEMENT 1: Filter by contractor's registered services
    if (contractor?.contractor?.services?.length > 0) {
      query.service = { $in: contractor.contractor.services };
    } else {
      // If contractor has no services registered, return empty result
      return {
        jobs: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        membershipInfo: effectivePlan,
        leadInfo: leadCheck,
        contractorInfo: {
          services: [],
          location: contractorLocation,
        },
      };
    }

    // Apply additional filters
    if (filters.service) {
      // If specific service filter is provided, further filter within contractor's services
      const contractorServices = contractor.contractor.services;
      if (contractorServices.includes(filters.service)) {
        query.service = filters.service;
      } else {
        // Service not in contractor's services, return empty result
        return {
          jobs: [],
          total: 0,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          membershipInfo: effectivePlan,
          leadInfo: leadCheck,
          contractorInfo: {
            services: contractorServices,
            location: contractorLocation,
          },
        };
      }
    }

    if (filters.search) {
      query.$or = [
        { title: new RegExp(filters.search, "i") },
        { description: new RegExp(filters.search, "i") },
      ];
    }

    // Pagination
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    // Sort options - by creation date (all jobs are accessible now)
    const sortOptions: any = {
      createdAt: -1, // Newest first
    };

    if (effectivePlan.featuredListing) {
      // Premium users get featured jobs first
      sortOptions.type = -1; // off_market first
    }

    // Execute aggregation pipeline with geospatial filtering
    const pipeline = [
      // Start with base query
      { $match: query },

      // Lookup properties first
      {
        $lookup: {
          from: "properties",
          localField: "property",
          foreignField: "_id",
          as: "property",
          pipeline: [{ $project: { title: 1, address: 1, location: 1 } }],
        },
      },
      {
        $addFields: {
          property: { $arrayElemAt: ["$property", 0] },
        },
      },

      // OPTIMIZATION 4: Optimized access history lookup with projection
      {
        $lookup: {
          from: "leadaccesses",
          let: { jobId: "$_id", contractorId: new Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$jobRequest", "$$jobId"] },
                    { $eq: ["$contractor", "$$contractorId"] },
                  ],
                },
              },
            },
            { $limit: 1 }, // Only need one record to check access
            { $project: { accessedAt: 1, membershipTier: 1 } },
          ],
          as: "accessHistory",
        },
      },

      // Lookup users
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
          pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }],
        },
      },
      {
        $lookup: {
          from: "bids",
          localField: "bids",
          foreignField: "_id",
          as: "bids",
          pipeline: [{ $project: { bidAmount: 1, contractor: 1, status: 1 } }],
        },
      },

      // Add computed fields
      {
        $addFields: {
          createdBy: { $arrayElemAt: ["$createdBy", 0] },
          bidCount: { $size: "$bids" },
          distance: 0,
          accessTime: {
            $add: [
              "$createdAt",
              { $multiply: [(effectivePlan.accessDelayHours || 24) * 60 * 60 * 1000] },
            ],
          },
          canAccessNow: {
            $lte: [
              {
                $add: [
                  "$createdAt",
                  { $multiply: [(effectivePlan.accessDelayHours || 24) * 60 * 60 * 1000] },
                ],
              },
              new Date(),
            ],
          },
          // ENHANCEMENT 2: Add access information
          alreadyAccessed: { $gt: [{ $size: "$accessHistory" }, 0] },
          accessInfo: { $arrayElemAt: ["$accessHistory", 0] },
        },
      },

      // Filter out jobs that are not accessible yet
      {
        $match: {
          canAccessNow: true,
        },
      },

      // Radius filtering will be done post-aggregation if needed

      // Sort
      { $sort: sortOptions },

      // Facet for pagination
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          count: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await JobRequest.aggregate(pipeline as any);
    let jobs = result.data || [];
    const total = result.count[0]?.total || 0;

    // Apply radius filtering post-aggregation if needed
    if (contractorLocation && effectivePlan.radiusKm !== null) {
      jobs = await filterJobsByRadius(jobs, contractorLocation, effectivePlan.radiusKm);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      jobs,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      membershipInfo: {
        tier: effectivePlan.tier,
        leadsPerMonth: effectivePlan.leadsPerMonth,
        accessDelayHours: effectivePlan.accessDelayHours,
        radiusKm: effectivePlan.radiusKm,
        featuredListing: effectivePlan.featuredListing,
        offMarketAccess: effectivePlan.offMarketAccess,
      },
      leadInfo: leadCheck,
      contractorInfo: {
        services: contractor?.contractor?.services || [],
        location: contractorLocation,
      },
    };
  } catch (error) {
    console.error("Error getting jobs for contractor:", error);
    throw error;
  }
}
