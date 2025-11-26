import { Types } from "mongoose";
import { JobRequest } from "@models/job/jobRequest";
import { Bid } from "@models/job/bid";
import { UserMembership } from "@models/user/userMembership";
import { User } from "@models/user/user";
import { LeadAccess } from "@models/job/leadAccess";
import { IUserMembership, IMembershipPlan } from "@models/types/membership";
import { toObjectId } from "@utils/core";
import { JOB_STATUSES } from "@models/constants";

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

    // Use effective benefits from membership (best of all upgrades)
    return {
      membership: membership as IUserMembership,
      plan,
      effectivePlan: {
        ...plan.toObject(),
        startDate: membership.startDate,
        billingPeriod: membership.billingPeriod,
        leadsUsedThisMonth: membership.leadsUsedThisMonth || 0,
        leadsUsedThisYear: membership.leadsUsedThisYear || 0,
        lastLeadResetDate: membership.lastLeadResetDate || membership.startDate,

        // CRITICAL: Include accumulated leads from upgrades
        accumulatedLeads: membership.accumulatedLeads || null,
        bonusLeadsFromUpgrade: membership.bonusLeadsFromUpgrade || 0,

        // Override with effective benefits (best of previous + current plan)
        leadsPerMonth: membership.effectiveLeadsPerMonth ?? plan.leadsPerMonth,
        accessDelayHours: membership.effectiveAccessDelayHours ?? plan.accessDelayHours,
        radiusKm: membership.effectiveRadiusKm ?? plan.radiusKm,
        featuredListing: membership.effectiveFeaturedListing ?? plan.featuredListing,
        offMarketAccess: membership.effectiveOffMarketAccess ?? plan.offMarketAccess,
        publicityReferences: membership.effectivePublicityReferences ?? plan.publicityReferences,
        verifiedBadge: membership.effectiveVerifiedBadge ?? plan.verifiedBadge,
        financingSupport: membership.effectiveFinancingSupport ?? plan.financingSupport,
        privateNetwork: membership.effectivePrivateNetwork ?? plan.privateNetwork,
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
// SUPPORTS: Monthly billing (monthly reset) and Yearly billing (annual credit pool)
export async function checkLeadLimit(userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
  leadsUsed: number;
  leadsLimit: number | null;
  remaining?: number;
  resetDate?: Date;
}> {
  const { membership, effectivePlan } = await getContractorMembership(userId);

  const now = new Date();
  const membershipStartDate = new Date(effectivePlan.startDate);
  const lastReset = new Date(effectivePlan.lastLeadResetDate);
  const billingPeriod = effectivePlan.billingPeriod;

  // ===========================
  // YEARLY BILLING: ANNUAL CREDIT POOL
  // ===========================
  if (billingPeriod === "yearly") {
    // PRIORITY 1: Use accumulated leads if available (from upgrades)
    // PRIORITY 2: Calculate from monthly leads * 12
    const yearlyLeadLimit =
      effectivePlan.accumulatedLeads !== null && effectivePlan.accumulatedLeads !== undefined
        ? effectivePlan.accumulatedLeads // Use accumulated leads from upgrades
        : effectivePlan.leadsPerMonth === null
          ? null
          : effectivePlan.leadsPerMonth * 12; // Fallback to calculated

    // Calculate which year period we're currently in
    const millisecondsPerYear = 365 * 24 * 60 * 60 * 1000;
    const timeSinceStart = now.getTime() - membershipStartDate.getTime();
    const yearsPassed = Math.floor(timeSinceStart / millisecondsPerYear);

    // Calculate current year period boundaries
    const currentYearStart = new Date(
      membershipStartDate.getTime() + yearsPassed * millisecondsPerYear,
    );
    const currentYearEnd = new Date(currentYearStart.getTime() + millisecondsPerYear);

    // Check if we've entered a new year period since last reset
    const shouldResetYearly = lastReset < currentYearStart;

    let leadsUsed = effectivePlan.leadsUsedThisYear || 0;

    // Reset yearly counter if we've entered a new year period
    if (shouldResetYearly && membership) {
      // Verify with LeadAccess count for the current year period
      const actualCount = await LeadAccess.countDocuments({
        contractor: userId,
        accessedAt: {
          $gte: currentYearStart,
          $lte: now,
        },
      });

      // Reset yearly counter
      await UserMembership.findByIdAndUpdate(membership._id, {
        leadsUsedThisYear: actualCount,
        lastLeadResetDate: now,
      });

      leadsUsed = actualCount;
    }

    // Next reset date is the start of next year period
    const nextYearReset = currentYearEnd;

    // If unlimited, always allow
    if (yearlyLeadLimit === null) {
      return {
        canAccess: true,
        leadsUsed,
        leadsLimit: null,
        remaining: -1, // unlimited
        resetDate: nextYearReset,
      };
    }

    // Check if annual limit reached
    if (leadsUsed >= yearlyLeadLimit) {
      return {
        canAccess: false,
        reason: `Annual lead limit reached (${leadsUsed}/${yearlyLeadLimit}). Resets on ${nextYearReset.toLocaleDateString()}.`,
        leadsUsed,
        leadsLimit: yearlyLeadLimit,
        remaining: 0,
        resetDate: nextYearReset,
      };
    }

    return {
      canAccess: true,
      leadsUsed,
      leadsLimit: yearlyLeadLimit,
      remaining: yearlyLeadLimit - leadsUsed,
      resetDate: nextYearReset,
    };
  }

  // ===========================
  // MONTHLY BILLING: MONTHLY RESET
  // ===========================
  const shouldResetMonthly = shouldResetLeadLimits(now, membershipStartDate, lastReset);

  let leadsUsed = effectivePlan.leadsUsedThisMonth || 0;

  // Reset monthly counter if month has passed
  if (shouldResetMonthly && membership) {
    const billingPeriodDates = getBillingPeriodForLeadCount(now, membershipStartDate);

    // Verify with LeadAccess count for the month
    const actualCount = await LeadAccess.countDocuments({
      contractor: userId,
      accessedAt: {
        $gte: billingPeriodDates.start,
        $lte: billingPeriodDates.end,
      },
    });

    // Reset monthly counter
    await UserMembership.findByIdAndUpdate(membership._id, {
      leadsUsedThisMonth: actualCount,
      lastLeadResetDate: now,
    });

    leadsUsed = actualCount;
  }

  // Calculate next monthly reset date
  const resetDate = getNextBillingResetDate(now, membershipStartDate);

  // PRIORITY 1: Use accumulated leads if available (from upgrades)
  // PRIORITY 2: Use monthly leads from plan
  const monthlyLeadLimit =
    effectivePlan.accumulatedLeads !== null && effectivePlan.accumulatedLeads !== undefined
      ? effectivePlan.accumulatedLeads // Use accumulated leads from upgrades
      : effectivePlan.leadsPerMonth; // Fallback to monthly plan

  // If unlimited, always allow
  if (monthlyLeadLimit === null) {
    return {
      canAccess: true,
      leadsUsed,
      leadsLimit: null,
      remaining: -1, // unlimited
      resetDate,
    };
  }

  // Check if monthly limit reached
  if (leadsUsed >= monthlyLeadLimit) {
    return {
      canAccess: false,
      reason: `Monthly lead limit reached (${leadsUsed}/${monthlyLeadLimit}). Resets on ${resetDate.toLocaleDateString()}.`,
      leadsUsed,
      leadsLimit: monthlyLeadLimit,
      remaining: 0,
      resetDate,
    };
  }

  return {
    canAccess: true,
    leadsUsed,
    leadsLimit: monthlyLeadLimit,
    remaining: Math.max(0, monthlyLeadLimit - leadsUsed),
    resetDate,
  };
}

// OPTIMIZED: Determine if lead limits should reset (ultra-precise and fast)
// CRITICAL: Lead limits ALWAYS reset monthly, regardless of billing period
// "leadsPerMonth" means leads per month, not per billing period
function shouldResetLeadLimits(now: Date, membershipStartDate: Date, lastReset: Date): boolean {
  // OPTIMIZATION 1: Normalize all dates to UTC milliseconds for precise comparison
  const nowMs = now.getTime();
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

  // CRITICAL FIX: Lead limits ALWAYS reset monthly
  // Even for yearly plans, leads reset every month (12 times per year)
  // The billing period only affects PAYMENT, not lead allocation
  const currentAnniversaryMs = getMonthlyAnniversaryMs(nowMs, startTime);
  const lastResetAnniversaryMs = getMonthlyAnniversaryMs(lastResetMs, startTime);

  return currentAnniversaryMs > lastResetAnniversaryMs;
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

// OPTIMIZED: Get billing period boundaries with ultra-precision (fast)
// CRITICAL: Lead counts are ALWAYS monthly, regardless of payment billing period
function getBillingPeriodForLeadCount(
  now: Date,
  membershipStartDate: Date,
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

  // CRITICAL FIX: Lead periods are ALWAYS monthly
  // Even for yearly billing, leads reset monthly (12 times per year)
  // Use Date.UTC for precise monthly calculations
  const startOfMonthMs = Date.UTC(
    nowTime.year,
    nowTime.month,
    startTime.date,
    startTime.hours,
    startTime.minutes,
    startTime.seconds,
    startTime.ms,
  );

  // Handle month overflow correctly
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

// OPTIMIZED: Calculate next lead reset date with ultra-precision (fast)
// CRITICAL: Lead resets are ALWAYS monthly, regardless of payment billing period
function getNextBillingResetDate(now: Date, membershipStartDate: Date): Date {
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

  // CRITICAL FIX: Lead resets are ALWAYS monthly
  // Handle month overflow correctly with UTC
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

// OPTIMIZED: Increment lead usage counter (fast operation)
export async function incrementLeadUsage(userId: string): Promise<void> {
  const { membership, effectivePlan } = await getContractorMembership(userId);

  if (membership) {
    // Increment the correct counter based on billing period
    if (effectivePlan.billingPeriod === "yearly") {
      // Yearly billing: Increment annual credit pool counter
      await UserMembership.findByIdAndUpdate(membership._id, {
        $inc: { leadsUsedThisYear: 1 },
      });
    } else {
      // Monthly billing: Increment monthly counter
      await UserMembership.findByIdAndUpdate(membership._id, {
        $inc: { leadsUsedThisMonth: 1 },
      });
    }
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

// Filter jobs by radius and remove property field in single pass
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
        // Remove property field and add distance in single operation
        const { property: _property, ...jobWithoutProperty } = job;
        filteredJobs.push({
          ...jobWithoutProperty,
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

export async function getJobsForContractor(
  userId: string,
  filters: any = {},
): Promise<{
  jobs: any[];
  total: number;
  pagination: any;
}> {
  try {
    const { effectivePlan } = await getContractorMembership(userId);

    const contractor = await User.findById(userId).select("contractor.services geoHome");
    const contractorLocation = contractor?.geoHome
      ? {
          lat: contractor.geoHome.coordinates[1],
          lng: contractor.geoHome.coordinates[0],
        }
      : null;

    const statusFilter =
      filters.status && JOB_STATUSES.includes(filters.status as any) ? filters.status : "open";

    const query: any = {
      status: statusFilter,
    };

    if (!effectivePlan.offMarketAccess) {
      query.type = { $ne: "off_market" };
    }

    if (contractor?.contractor?.services?.length > 0) {
      query.service = { $in: contractor.contractor.services };
    } else {
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

    const accessDelay = (effectivePlan.accessDelayHours ?? 24) * 60 * 60 * 1000;
    const currentTime = new Date();

    const pipeline = [
      { $match: query },

      ...(statusFilter === "open"
        ? [
            {
              $lookup: {
                from: "bids",
                let: { jobId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$jobRequest", "$$jobId"] },
                          { $eq: ["$contractor", toObjectId(userId)] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                  { $project: { _id: 1 } },
                ],
                as: "selfBid",
              },
            },
            {
              $match: {
                selfBid: { $size: 0 },
              },
            },
            {
              $project: {
                selfBid: 0,
              },
            },
          ]
        : []),

      ...(statusFilter === "open"
        ? [
            {
              $match: {
                $expr: {
                  $lte: [{ $add: ["$createdAt", accessDelay] }, currentTime],
                },
              },
            },
          ]
        : []),

      ...(contractorLocation && effectivePlan.radiusKm !== null
        ? [
            {
              $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "propertyData",
                pipeline: [
                  {
                    $match: {
                      "location.coordinates": {
                        $geoWithin: {
                          $centerSphere: [
                            [contractorLocation.lng, contractorLocation.lat],
                            effectivePlan.radiusKm / 6378.1,
                          ],
                        },
                      },
                    },
                  },
                  { $project: { location: 1 } },
                ],
              },
            },
            {
              $match: {
                propertyData: { $ne: [] },
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ["$propertyData", 0] },
              },
            },
            {
              $project: {
                propertyData: 0,
              },
            },
          ]
        : []),

      ...(contractorLocation && effectivePlan.radiusKm !== null
        ? [
            {
              $project: {
                _id: 1,
                property: 1,
                title: 1,
                description: 1,
                service: 1,
                estimate: 1,
                type: 1,
                status: 1,
                timeline: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ]
        : [
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                service: 1,
                estimate: 1,
                type: 1,
                status: 1,
                timeline: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ]),

      { $sort: sortOptions },

      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          count: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await JobRequest.aggregate(pipeline as any);
    const jobs = result.data || [];
    const total = result.count[0]?.total || 0;

    // Calculate pagination info based on actual filtered results
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
    };
  } catch (error) {
    console.error("Error getting jobs for contractor:", error);
    throw error;
  }
}

// Get contractor's own jobs (jobs they've bid on) with bid details
export async function getContractorMyJobs(
  userId: string,
  filters: any = {},
): Promise<{
  jobs: any[];
  total: number;
  pagination: any;
}> {
  try {
    const { effectivePlan } = await getContractorMembership(userId);

    const contractor = await User.findById(userId).select("contractor.services geoHome");
    const contractorLocation = contractor?.geoHome
      ? {
          lat: contractor.geoHome.coordinates[1],
          lng: contractor.geoHome.coordinates[0],
        }
      : null;

    const statusFilter =
      filters.status && JOB_STATUSES.includes(filters.status as any) ? filters.status : undefined;

    const bidStatusFilter = filters.bidStatus;

    const effectiveBidStatusFilter =
      bidStatusFilter ||
      (statusFilter && ["inprogress", "hold", "completed"].includes(statusFilter)
        ? "accepted"
        : undefined);

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const bidMatchQuery: any = {
      contractor: toObjectId(userId),
    };

    if (effectiveBidStatusFilter) {
      bidMatchQuery.status = effectiveBidStatusFilter;
    }

    const jobMatchQuery: any = {};
    if (statusFilter) {
      jobMatchQuery.status = statusFilter;
    }
    if (contractor?.contractor?.services?.length > 0) {
      jobMatchQuery.service = { $in: contractor.contractor.services };
    }
    if (filters.search) {
      jobMatchQuery.$or = [
        { title: new RegExp(filters.search, "i") },
        { description: new RegExp(filters.search, "i") },
      ];
    }

    const pipeline = [
      {
        $match: bidMatchQuery,
      },
      {
        $lookup: {
          from: "jobrequests",
          localField: "jobRequest",
          foreignField: "_id",
          as: "job",
          pipeline: [
            ...(Object.keys(jobMatchQuery).length > 0 ? [{ $match: jobMatchQuery }] : []),
            {
              $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "property",
                pipeline: [
                  {
                    $project: {
                      title: 1,
                      propertyType: 1,
                      location: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ["$property", 0] },
              },
            },
            ...(contractorLocation && effectivePlan.radiusKm !== null
              ? [
                  {
                    $match: {
                      "property.location.coordinates": {
                        $geoWithin: {
                          $centerSphere: [
                            [contractorLocation.lng, contractorLocation.lat],
                            effectivePlan.radiusKm / 6378.1,
                          ],
                        },
                      },
                    },
                  },
                ]
              : []),
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "customer",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      firstName: 1,
                      lastName: 1,
                      email: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                customerData: { $arrayElemAt: ["$customer", 0] },
              },
            },
            {
              $project: {
                customer: 0,
              },
            },
          ],
        },
      },
      {
        $match: {
          job: { $ne: [] },
        },
      },
      {
        $addFields: {
          job: { $arrayElemAt: ["$job", 0] },
        },
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $addFields: {
          "job.createdBy": {
            $cond: {
              if: { $eq: ["$status", "accepted"] },
              then: "$job.customerData",
              else: {
                _id: { $ifNull: ["$job.customerData._id", null] },
              },
            },
          },
        },
      },
      {
        $project: {
          "job.customerData": 0,
        },
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: "$jobRequest",
                title: "$job.title",
                service: "$job.service",
                estimate: "$job.estimate",
                bidAmount: "$bidAmount",
                timeline: "$job.timeline",
              },
            },
          ],
          count: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await Bid.aggregate(pipeline as any);
    const jobs = result?.data || [];
    const total = result?.count[0]?.total || 0;

    const totalPages = Math.ceil(total / limit);

    return {
      jobs,
      total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error getting contractor my jobs:", error);
    throw error;
  }
}
