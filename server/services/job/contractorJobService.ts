import { Types } from "mongoose";
import { JobRequest } from "@models/job/jobRequest";
import { UserMembership } from "@models/user/userMembership";
import { MembershipPlan } from "@models/membership/membershipPlan";
import { User } from "@models/user/user";
import { Property } from "@models/property/property";
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

// Check if contractor has reached lead limit
export async function checkLeadLimit(userId: string): Promise<{
  canAccess: boolean;
  reason?: string;
  leadsUsed: number;
  leadsLimit: number | null;
}> {
  const { membership, effectivePlan } = await getContractorMembership(userId);

  // If no limit (unlimited), always allow
  if (effectivePlan.leadsPerMonth === null) {
    return {
      canAccess: true,
      leadsUsed: 0,
      leadsLimit: null,
    };
  }

  // Check if we need to reset the counter (new month)
  const now = new Date();
  const lastReset = new Date(effectivePlan.lastLeadResetDate);
  const shouldReset =
    now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

  let leadsUsed = effectivePlan.leadsUsedThisMonth || 0;

  if (shouldReset && membership) {
    // Reset the counter
    leadsUsed = 0;
    await UserMembership.findByIdAndUpdate(membership._id, {
      leadsUsedThisMonth: 0,
      lastLeadResetDate: now,
    });
  }

  if (leadsUsed >= effectivePlan.leadsPerMonth) {
    return {
      canAccess: false,
      reason: `Monthly lead limit reached (${leadsUsed}/${effectivePlan.leadsPerMonth})`,
      leadsUsed,
      leadsLimit: effectivePlan.leadsPerMonth,
    };
  }

  return {
    canAccess: true,
    leadsUsed,
    leadsLimit: effectivePlan.leadsPerMonth,
  };
}

// Increment lead usage counter
export async function incrementLeadUsage(userId: string): Promise<void> {
  const { membership } = await getContractorMembership(userId);

  if (membership) {
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
}> {
  try {
    const { effectivePlan } = await getContractorMembership(userId);
    const leadCheck = await checkLeadLimit(userId);

    if (!leadCheck.canAccess) {
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
      };
    }

    // Get contractor location
    const contractorLocation = await getContractorLocation(userId);

    // Build base query
    const query: any = {
      status: "open",
    };

    // Filter out off-market jobs if contractor doesn't have access
    if (!effectivePlan.offMarketAccess) {
      query.type = { $ne: "off_market" };
    }

    // Don't filter by creation date - show all jobs but with access time calculation

    // Apply additional filters
    if (filters.service) {
      query.service = new RegExp(filters.service, "i");
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
          // Simple distance placeholder (will be calculated post-aggregation if needed)
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
    };
  } catch (error) {
    console.error("Error getting jobs for contractor:", error);
    throw error;
  }
}
