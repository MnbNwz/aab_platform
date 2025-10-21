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

// Calculate platform health score based on user status distribution
const calculatePlatformHealth = (analytics: any): number => {
  try {
    const { totalUsers, totalApproved, totalPending, totalRejected } = analytics.users;

    // If no users, return 0
    if (totalUsers === 0) {
      return 0;
    }

    // Calculate user status ratios with graceful weighting
    const approvedRatio = totalApproved / totalUsers;
    const pendingRatio = totalPending / totalUsers;
    const rejectedRatio = totalRejected / totalUsers;

    // Graceful scoring system:
    // - Approved users: Full points (1.0)
    // - Pending users: Partial points (0.5) - they're in process
    // - Rejected users: Negative points (-0.2) - but not too harsh
    const healthScore =
      approvedRatio * 1.0 + // Approved users get full credit
      pendingRatio * 0.5 + // Pending users get half credit
      rejectedRatio * -0.2; // Rejected users get small penalty

    // Convert to percentage and ensure it's between 0-100
    const percentageScore = Math.max(0, Math.min(100, healthScore * 100));

    return Math.round(percentageScore * 100) / 100; // Round to 2 decimal places
  } catch {
    return 0;
  }
};
