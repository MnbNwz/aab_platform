import { LeadAccess } from "@models/leadAccess";
import { JobRequest } from "@models/jobRequest";
import { User } from "@models/user";
import { MembershipPlan } from "@models/membershipPlan";
import { getCurrentMembership } from "@services/membership/membership";
import { logErrorWithContext } from "@utils/core";

// Membership lead limits
const MEMBERSHIP_LIMITS = {
  basic: { leads: 25, delayHours: 24 }, // Basic tier - 25 leads, 24h delay
  standard: { leads: 40, delayHours: 12 }, // Standard tier - 40 leads, 12h delay
  premium: { leads: -1, delayHours: 0 }, // Premium tier - unlimited leads, instant access
};

// Get current month and year
const getCurrentPeriod = () => {
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

// Get contractor's lead usage for current month
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
    const membership = await getCurrentMembership(contractorId);
    if (!membership) {
      throw new Error("No active membership found");
    }

    const membershipTier = await getMembershipTier(membership);
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];

    if (!limits) {
      throw new Error("Invalid membership tier");
    }

    const { month, year } = getCurrentPeriod();
    const used = await LeadAccess.countDocuments({
      contractor: contractorId,
      month,
      year,
    });

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
    // Get contractor's membership and lead usage
    const membership = await getCurrentMembership(contractorId);
    if (!membership) {
      throw new Error("No active membership found");
    }

    const membershipTier = await getMembershipTier(membership);
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];
    const leadUsage = await getLeadUsage(contractorId);

    // Build query
    const query: any = { status: "open" };

    // Add service filter if contractor has specific services
    if (contractorId) {
      const contractor = await User.findById(contractorId);
      if (
        contractor &&
        contractor.contractor &&
        contractor.contractor.services &&
        contractor.contractor.services.length > 0
      ) {
        query.service = { $in: contractor.contractor.services };
      }
    }

    // Add other filters
    if (filters.service) {
      query.service = filters.service;
    }
    if (filters.propertyType) {
      query["property.propertyType"] = filters.propertyType;
    }
    if (filters.minEstimate) {
      query.estimate = { $gte: filters.minEstimate };
    }
    if (filters.maxEstimate) {
      query.estimate = { ...query.estimate, $lte: filters.maxEstimate };
    }

    // Get all matching job requests
    const allJobRequests = await JobRequest.find(query)
      .populate("property")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

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
