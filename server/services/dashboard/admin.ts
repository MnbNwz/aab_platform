import { User } from "@models/user";
import { JobRequest } from "@models/job";
import { UserMembership } from "@models/user";
import { logErrorWithContext } from "@utils/core";

// Get comprehensive platform analytics for admin dashboard
export const getPlatformAnalytics = async () => {
  try {
    // Execute aggregations individually to prevent total failure if one fails
    let jobAnalytics, userAnalytics, membershipAnalytics;

    try {
      jobAnalytics = await getJobAnalytics();
    } catch (error) {
      console.error("Job analytics failed:", error);
      jobAnalytics = {
        totalJobs: 0,
        openJobs: 0,
        inProgressJobs: 0,
        completedJobs: 0,
        cancelledJobs: 0,
        monthlyJobs: [],
        serviceBreakdown: [],
      };
    }

    try {
      userAnalytics = await getUserAnalytics();
    } catch (error) {
      console.error("User analytics failed:", error);
      userAnalytics = { totalUsers: 0, totalApproved: 0, roles: [] };
    }

    try {
      membershipAnalytics = await getMembershipAnalytics();
    } catch (error) {
      console.error("Membership analytics failed:", error);
      membershipAnalytics = { totalMemberships: 0, membershipBreakdown: [] };
    }

    // Calculate platform health score
    const platformHealth = calculatePlatformHealth({
      jobs: jobAnalytics,
      users: userAnalytics,
    });

    return {
      platform: {
        users: userAnalytics,
        jobs: jobAnalytics,
        memberships: membershipAnalytics,
      },
      summary: {
        healthScore: platformHealth,
      },
    };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getPlatformAnalytics",
    });
    throw error;
  }
};

// Job analytics aggregation (counts only, no money metrics)
const getJobAnalytics = async () => {
  const pipeline = [
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        openJobs: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        inProgressJobs: { $sum: { $cond: [{ $eq: ["$status", "inprogress"] }, 1, 0] } },
        completedJobs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        cancelledJobs: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },

        // Monthly breakdown (counts only)
        monthlyJobs: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            status: "$status",
          },
        },

        // Service breakdown (counts only)
        serviceBreakdown: {
          $push: {
            service: "$service",
            status: "$status",
          },
        },
      },
    },
  ];

  const [result] = await JobRequest.aggregate(pipeline);
  if (!result) {
    return {
      totalJobs: 0,
      openJobs: 0,
      inProgressJobs: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      monthlyJobs: [],
      serviceBreakdown: [],
    };
  }

  // Remove _id from result
  const { _id, ...cleanResult } = result;
  return cleanResult;
};

// User analytics aggregation
const getUserAnalytics = async () => {
  const pipeline = [
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ["$approval", "approved"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$approval", "pending"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$approval", "rejected"] }, 1, 0] } },
      },
    },
    {
      $group: {
        _id: null,
        roles: {
          $push: {
            role: "$_id",
            count: "$count",
            approved: "$approved",
            pending: "$pending",
            rejected: "$rejected",
          },
        },
        totalUsers: { $sum: "$count" },
        totalApproved: { $sum: "$approved" },
        totalPending: { $sum: "$pending" },
        totalRejected: { $sum: "$rejected" },
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);
  if (!result) {
    return {
      roles: [
        { role: "admin", count: 0, approved: 0, pending: 0, rejected: 0 },
        { role: "customer", count: 0, approved: 0, pending: 0, rejected: 0 },
        { role: "contractor", count: 0, approved: 0, pending: 0, rejected: 0 },
      ],
      totalUsers: 0,
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
    };
  }

  // Remove _id from result
  const { _id, ...cleanResult } = result;

  // Ensure all three roles are present (admin, customer, contractor)
  const existingRoles = new Set(cleanResult.roles.map((r: any) => r.role));
  const allRoles = [
    { role: "admin", count: 0, approved: 0, pending: 0, rejected: 0 },
    { role: "customer", count: 0, approved: 0, pending: 0, rejected: 0 },
    { role: "contractor", count: 0, approved: 0, pending: 0, rejected: 0 },
  ];

  // Merge existing data with default structure
  cleanResult.roles = allRoles.map((defaultRole) => {
    const existingRole = cleanResult.roles.find((r: any) => r.role === defaultRole.role);
    return existingRole || defaultRole;
  });

  return cleanResult;
};

// Membership analytics aggregation (counts only, no revenue metrics)
const getMembershipAnalytics = async () => {
  const pipeline = [
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        membershipBreakdown: {
          $push: {
            status: "$_id",
            count: "$count",
          },
        },
        totalMemberships: { $sum: "$count" },
      },
    },
  ];

  const [result] = await UserMembership.aggregate(pipeline);
  if (!result) {
    return {
      membershipBreakdown: [],
      totalMemberships: 0,
    };
  }

  // Remove _id from result
  const { _id, ...cleanResult } = result;
  return cleanResult;
};

// Calculate platform health score
const calculatePlatformHealth = (analytics: any): number => {
  try {
    const jobCompletionRate =
      analytics.jobs.totalJobs > 0
        ? (analytics.jobs.completedJobs / analytics.jobs.totalJobs) * 100
        : 0;

    const userApprovalRate =
      analytics.users.totalUsers > 0
        ? (analytics.users.totalApproved / analytics.users.totalUsers) * 100
        : 0;

    // Calculate weighted health score based on job completion and user approval
    const healthScore =
      jobCompletionRate * 0.6 + // 60% weight on job completion
      userApprovalRate * 0.4; // 40% weight on user approval

    return Math.round(healthScore * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    return 0;
  }
};
