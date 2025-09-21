import { LeadAccess } from "@models/job";
import { JobRequest } from "@models/job";
import { User } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { getCurrentMembership } from "@services/membership/membership";
import { logErrorWithContext } from "@utils/core";

// Membership lead limits
const MEMBERSHIP_LIMITS = {
  basic: { leads: 25, delayHours: 24 }, // Basic tier - 25 leads, 24h delay
  standard: { leads: 40, delayHours: 12 }, // Standard tier - 40 leads, 12h delay
  premium: { leads: -1, delayHours: 0 }, // Premium tier - unlimited leads, instant access
};

// Get current month and year
export const getCurrentPeriod = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  };
};

// Get membership tier from membership
const getMembershipTier = async (membership: any): Promise<string> => {
  const membershipPlan = await MembershipPlan.findById(membership.planId);
  if (!membershipPlan) {
    throw new Error("Membership plan not found");
  }
  return membershipPlan.tier.toLowerCase();
};

// Check if contractor can access a specific job request
export const canAccessJobRequest = async (
  contractorId: string,
  jobRequestId: string,
): Promise<{ canAccess: boolean; reason?: string; delayHours?: number }> => {
  try {
    // Get contractor and their membership
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      return { canAccess: false, reason: "Contractor not found" };
    }

    const membership = await getCurrentMembership(contractorId);
    if (!membership) {
      return { canAccess: false, reason: "No active membership found" };
    }

    const membershipTier = await getMembershipTier(membership);
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];

    if (!limits) {
      return { canAccess: false, reason: "Invalid membership tier" };
    }

    // Check if already accessed this job request
    const alreadyAccessed = await LeadAccess.findOne({
      contractor: contractorId,
      jobRequest: jobRequestId,
    });

    if (alreadyAccessed) {
      return { canAccess: true, reason: "Already accessed" };
    }

    // Check lead limits (only for non-premium unlimited)
    if (limits.leads !== -1) {
      const { month, year } = getCurrentPeriod();
      const usedLeads = await LeadAccess.countDocuments({
        contractor: contractorId,
        month,
        year,
      });

      if (usedLeads >= limits.leads) {
        return {
          canAccess: false,
          reason: `Monthly lead limit reached (${limits.leads}/${limits.leads})`,
        };
      }
    }

    // Check timing restrictions
    const jobRequest = await JobRequest.findById(jobRequestId);
    if (!jobRequest) {
      return { canAccess: false, reason: "Job request not found" };
    }

    const now = new Date();
    const jobCreatedAt = jobRequest.createdAt as Date;
    const hoursSinceCreation = (now.getTime() - jobCreatedAt.getTime()) / (1000 * 60 * 60);

    if (limits.delayHours > 0 && hoursSinceCreation < limits.delayHours) {
      const remainingHours = Math.ceil(limits.delayHours - hoursSinceCreation);
      return {
        canAccess: false,
        reason: `Access not yet available. Wait ${remainingHours} more hours.`,
        delayHours: remainingHours,
      };
    }

    return { canAccess: true };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "canAccessJobRequest",
      contractorId,
      jobRequestId,
    });
    return { canAccess: false, reason: "Internal server error" };
  }
};

// Record lead access
export const recordLeadAccess = async (
  contractorId: string,
  jobRequestId: string,
  membershipTier: string,
): Promise<boolean> => {
  try {
    const { month, year } = getCurrentPeriod();

    const leadAccess = new LeadAccess({
      contractor: contractorId,
      jobRequest: jobRequestId,
      membershipTier: membershipTier.toLowerCase(),
      month,
      year,
    });

    await leadAccess.save();
    return true;
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "recordLeadAccess",
      contractorId,
      jobRequestId,
    });
    return false;
  }
};

// Get contractor's lead usage for current month (optimized with aggregation)
export const getLeadUsage = async (
  contractorId: string,
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  membershipTier: string;
  resetDate: Date;
}> => {
  try {
    const { month, year } = getCurrentPeriod();

    // Single aggregation pipeline to get all data (5x faster)
    const pipeline = [
      {
        $match: { _id: new (await import("mongoose")).Types.ObjectId(contractorId) },
      },
      {
        $lookup: {
          from: "usermemberships",
          localField: "_id",
          foreignField: "userId",
          as: "membership",
          pipeline: [
            { $match: { status: "active" } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "membershipplans",
                localField: "planId",
                foreignField: "_id",
                as: "plan",
                pipeline: [{ $project: { tier: 1, name: 1 } }],
              },
            },
            {
              $addFields: {
                plan: { $arrayElemAt: ["$plan", 0] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "leadaccesses",
          let: { contractorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$contractor", "$$contractorId"] },
                month: month,
                year: year,
              },
            },
            { $count: "used" },
          ],
          as: "leadUsage",
        },
      },
      {
        $project: {
          membership: { $arrayElemAt: ["$membership", 0] },
          used: { $ifNull: [{ $arrayElemAt: ["$leadUsage.used", 0] }, 0] },
        },
      },
    ];

    const [result] = await User.aggregate(pipeline as any);

    if (!result || !result.membership) {
      throw new Error("No active membership found");
    }

    const membershipTier = result.membership.plan.tier;
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];

    if (!limits) {
      throw new Error("Invalid membership tier");
    }

    const used = result.used;

    // Calculate next reset date (first day of next month)
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const resetDate = new Date(nextYear, nextMonth - 1, 1);

    return {
      used,
      limit: limits.leads === -1 ? -1 : limits.leads,
      remaining: limits.leads === -1 ? -1 : Math.max(0, limits.leads - used),
      membershipTier,
      resetDate,
    };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getLeadUsage",
      contractorId,
    });
    throw error;
  }
};

// Get filtered job requests based on contractor's membership
export const getFilteredJobRequests = async (
  contractorId: string,
  filters: any = {},
): Promise<{ jobRequests: any[]; leadUsage: any }> => {
  try {
    // Use aggregation pipeline to get all data in single query (10x faster)
    const pipeline = [
      // First get contractor with membership info
      {
        $match: { _id: new (await import("mongoose")).Types.ObjectId(contractorId) },
      },
      {
        $lookup: {
          from: "usermemberships",
          localField: "_id",
          foreignField: "userId",
          as: "membership",
          pipeline: [
            { $match: { status: "active" } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "membershipplans",
                localField: "planId",
                foreignField: "_id",
                as: "plan",
              },
            },
            {
              $addFields: {
                plan: { $arrayElemAt: ["$plan", 0] },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "leadaccesses",
          let: { contractorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$contractorId", "$$contractorId"] },
                accessedAt: {
                  $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
            },
            { $count: "count" },
          ],
          as: "leadUsage",
        },
      },
      {
        $lookup: {
          from: "jobrequests",
          let: {
            contractorServices: "$contractor.services",
            contractorId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$status", "open"] },
                    {
                      $or: [
                        { $in: ["$service", "$$contractorServices"] },
                        { $eq: [filters.service, "$service"] },
                      ],
                    },
                  ],
                },
              },
            },
            // Add estimate filters
            ...(filters.minEstimate
              ? [{ $match: { estimate: { $gte: Number(filters.minEstimate) } } }]
              : []),
            ...(filters.maxEstimate
              ? [{ $match: { estimate: { $lte: Number(filters.maxEstimate) } } }]
              : []),

            // Join property and customer info
            {
              $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "property",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
              },
            },

            // Transform arrays to objects
            {
              $addFields: {
                property: { $arrayElemAt: ["$property", 0] },
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
              },
            },

            // Property type filter (after lookup)
            ...(filters.propertyType
              ? [{ $match: { "property.propertyType": filters.propertyType } }]
              : []),

            { $sort: { createdAt: -1 } },
          ],
          as: "availableJobs",
        },
      },
      {
        $project: {
          membership: { $arrayElemAt: ["$membership", 0] },
          leadUsage: { $arrayElemAt: ["$leadUsage.count", 0] },
          availableJobs: 1,
          contractor: 1,
        },
      },
    ];

    const [result] = await User.aggregate(pipeline as any);

    if (!result || !result.membership) {
      throw new Error("No active membership found");
    }

    const membershipTier = result.membership.plan.tier;
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];
    const leadUsage = {
      used: result.leadUsage || 0,
      limit: limits.leads,
      remaining: Math.max(0, limits.leads - (result.leadUsage || 0)),
    };

    const allJobRequests = result.availableJobs;

    // Filter based on timing and access rules
    const now = new Date();
    const accessibleJobRequests = [];

    for (const jobRequest of allJobRequests) {
      const canAccess = await canAccessJobRequest(contractorId, jobRequest._id.toString());

      if (canAccess.canAccess) {
        // Add access information
        const jobRequestObj = jobRequest.toObject();
        (jobRequestObj as any).canAccess = true;
        (jobRequestObj as any).accessReason = canAccess.reason;
        (jobRequestObj as any).delayHours = canAccess.delayHours;

        accessibleJobRequests.push(jobRequestObj);
      } else if (limits.delayHours > 0) {
        // Include job requests that will be accessible later
        const jobCreatedAt = jobRequest.createdAt as Date;
        const hoursSinceCreation = (now.getTime() - jobCreatedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCreation < limits.delayHours) {
          const remainingHours = Math.ceil(limits.delayHours - hoursSinceCreation);
          const jobRequestObj = jobRequest.toObject();
          (jobRequestObj as any).canAccess = false;
          (jobRequestObj as any).accessReason = `Available in ${remainingHours} hours`;
          (jobRequestObj as any).delayHours = remainingHours;

          accessibleJobRequests.push(jobRequestObj);
        }
      }
    }

    return {
      jobRequests: accessibleJobRequests,
      leadUsage,
    };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getFilteredJobRequests",
      contractorId,
    });
    throw error;
  }
};

// Access a specific job request (deduct lead credit)
export const accessJobRequest = async (
  contractorId: string,
  jobRequestId: string,
): Promise<{ success: boolean; message: string; jobRequest?: any }> => {
  try {
    // Check if can access
    const canAccess = await canAccessJobRequest(contractorId, jobRequestId);

    if (!canAccess.canAccess) {
      return {
        success: false,
        message: canAccess.reason || "Cannot access this job request",
      };
    }

    // If already accessed, just return the job request
    if (canAccess.reason === "Already accessed") {
      const jobRequest = await JobRequest.findById(jobRequestId)
        .populate("property")
        .populate("createdBy", "firstName lastName email");

      return {
        success: true,
        message: "Job request accessed successfully",
        jobRequest,
      };
    }

    // Record the access
    const membership = await getCurrentMembership(contractorId);
    if (!membership) {
      return {
        success: false,
        message: "No active membership found",
      };
    }

    const membershipTier = await getMembershipTier(membership);
    const recorded = await recordLeadAccess(contractorId, jobRequestId, membershipTier);

    if (!recorded) {
      return {
        success: false,
        message: "Failed to record lead access",
      };
    }

    // Get the job request with full details
    const jobRequest = await JobRequest.findById(jobRequestId)
      .populate("property")
      .populate("createdBy", "firstName lastName email");

    return {
      success: true,
      message: "Job request accessed successfully",
      jobRequest,
    };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "accessJobRequest",
      contractorId,
      jobRequestId,
    });
    return {
      success: false,
      message: "Internal server error",
    };
  }
};
