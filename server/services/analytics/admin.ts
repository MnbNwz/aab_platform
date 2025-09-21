import { User } from "@models/user";
import { JobRequest } from "@models/job";
import { Payment } from "@models/payment";
import { UserMembership } from "@models/user";
import { Bid } from "@models/job";
import mongoose from "mongoose";
import { logErrorWithContext } from "@utils/core";

// Get comprehensive platform analytics for admin dashboard
export const getPlatformAnalytics = async () => {
  try {
    // Execute aggregations individually to prevent total failure if one fails
    let jobAnalytics,
      userAnalytics,
      paymentAnalytics,
      membershipAnalytics,
      bidAnalytics,
      recentActivity;

    try {
      jobAnalytics = await getJobAnalytics();
    } catch (error) {
      console.error("Job analytics failed:", error);
      jobAnalytics = { totalJobs: 0, openJobs: 0, completedJobs: 0, totalValue: 0 };
    }

    try {
      userAnalytics = await getUserAnalytics();
    } catch (error) {
      console.error("User analytics failed:", error);
      userAnalytics = { totalUsers: 0, totalApproved: 0, roles: [] };
    }

    try {
      paymentAnalytics = await getPaymentAnalytics();
    } catch (error) {
      console.error("Payment analytics failed:", error);
      paymentAnalytics = { totalPayments: 0, totalAmount: 0, successfulPayments: 0 };
    }

    try {
      membershipAnalytics = await getMembershipAnalytics();
    } catch (error) {
      console.error("Membership analytics failed:", error);
      membershipAnalytics = { totalMemberships: 0, totalRevenue: 0, membershipBreakdown: [] };
    }

    try {
      bidAnalytics = await getBidAnalytics();
    } catch (error) {
      console.error("Bid analytics failed:", error);
      bidAnalytics = { totalBids: 0, acceptedBids: 0, avgBidAmount: 0 };
    }

    try {
      recentActivity = await getRecentActivity();
    } catch (error) {
      console.error("Recent activity failed:", error);
      recentActivity = [];
    }

    // Calculate platform health score
    const platformHealth = calculatePlatformHealth({
      jobs: jobAnalytics,
      users: userAnalytics,
      payments: paymentAnalytics,
    });

    return {
      jobs: jobAnalytics,
      users: userAnalytics,
      payments: paymentAnalytics,
      memberships: membershipAnalytics,
      bids: bidAnalytics,
      recentActivity,
      platformHealth,
      summary: {
        totalJobs: jobAnalytics.totalJobs,
        totalUsers: userAnalytics.totalUsers,
        totalRevenue: paymentAnalytics.totalAmount,
        totalMemberships: membershipAnalytics.totalMemberships,
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

// Job analytics aggregation
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
        totalValue: { $sum: "$estimate" },
        avgJobValue: { $avg: "$estimate" },

        // Monthly breakdown
        monthlyJobs: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            status: "$status",
            value: "$estimate",
          },
        },

        // Service breakdown
        serviceBreakdown: {
          $push: {
            service: "$service",
            estimate: "$estimate",
            status: "$status",
          },
        },
      },
    },
  ];

  const [result] = await JobRequest.aggregate(pipeline);
  return (
    result || {
      totalJobs: 0,
      openJobs: 0,
      inProgressJobs: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      totalValue: 0,
      avgJobValue: 0,
      monthlyJobs: [],
      serviceBreakdown: [],
    }
  );
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

        // Monthly registration breakdown
        monthlyRegistrations: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            approval: "$approval",
          },
        },
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
            monthlyRegistrations: "$monthlyRegistrations",
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
  return (
    result || {
      roles: [],
      totalUsers: 0,
      totalApproved: 0,
      totalPending: 0,
      totalRejected: 0,
    }
  );
};

// Payment analytics aggregation
const getPaymentAnalytics = async () => {
  const pipeline = [
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        successfulPayments: { $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] } },
        failedPayments: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        pendingPayments: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        avgPaymentAmount: { $avg: "$amount" },

        // Monthly revenue breakdown
        monthlyRevenue: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            amount: "$amount",
            status: "$status",
          },
        },

        // Payment method breakdown
        paymentMethods: {
          $push: {
            method: "$paymentMethod",
            amount: "$amount",
            status: "$status",
          },
        },
      },
    },
  ];

  const [result] = await Payment.aggregate(pipeline);
  return (
    result || {
      totalPayments: 0,
      totalAmount: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0,
      avgPaymentAmount: 0,
      monthlyRevenue: [],
      paymentMethods: [],
    }
  );
};

// Membership analytics aggregation
const getMembershipAnalytics = async () => {
  const pipeline = [
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
    {
      $group: {
        _id: {
          planName: "$plan.name",
          tier: "$plan.tier",
          status: "$status",
        },
        count: { $sum: 1 },
        totalRevenue: { $sum: "$plan.price" },
        avgDuration: { $avg: { $subtract: ["$endDate", "$startDate"] } },

        // Monthly subscription breakdown
        monthlySubscriptions: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            price: "$plan.price",
            status: "$status",
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        membershipBreakdown: {
          $push: {
            planName: "$_id.planName",
            tier: "$_id.tier",
            status: "$_id.status",
            count: "$count",
            totalRevenue: "$totalRevenue",
            avgDuration: "$avgDuration",
            monthlySubscriptions: "$monthlySubscriptions",
          },
        },
        totalMemberships: { $sum: "$count" },
        totalRevenue: { $sum: "$totalRevenue" },
      },
    },
  ];

  const [result] = await UserMembership.aggregate(pipeline);
  return (
    result || {
      membershipBreakdown: [],
      totalMemberships: 0,
      totalRevenue: 0,
    }
  );
};

// Bid analytics aggregation
const getBidAnalytics = async () => {
  const pipeline = [
    {
      $lookup: {
        from: "jobrequests",
        localField: "jobRequest",
        foreignField: "_id",
        as: "job",
        pipeline: [{ $project: { service: 1, estimate: 1, status: 1 } }],
      },
    },
    {
      $addFields: {
        job: { $arrayElemAt: ["$job", 0] },
      },
    },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        acceptedBids: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
        pendingBids: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        rejectedBids: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        avgBidAmount: { $avg: "$bidAmount" },
        totalBidValue: { $sum: "$bidAmount" },

        // Service-wise bid breakdown
        serviceBids: {
          $push: {
            service: "$job.service",
            bidAmount: "$bidAmount",
            status: "$status",
          },
        },

        // Monthly bid breakdown
        monthlyBids: {
          $push: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
            amount: "$bidAmount",
            status: "$status",
          },
        },
      },
    },
  ];

  const [result] = await Bid.aggregate(pipeline);
  return (
    result || {
      totalBids: 0,
      acceptedBids: 0,
      pendingBids: 0,
      rejectedBids: 0,
      avgBidAmount: 0,
      totalBidValue: 0,
      serviceBids: [],
      monthlyBids: [],
    }
  );
};

// Get recent platform activity
const getRecentActivity = async () => {
  const pipeline = [
    {
      $unionWith: {
        coll: "users",
        pipeline: [
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $project: { type: { $literal: "user_registration" }, createdAt: 1, email: 1, role: 1 },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: "bids",
        pipeline: [
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          { $project: { type: { $literal: "bid_placed" }, createdAt: 1, bidAmount: 1, status: 1 } },
        ],
      },
    },
    {
      $unionWith: {
        coll: "payments",
        pipeline: [
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          {
            $project: {
              type: { $literal: "payment_processed" },
              createdAt: 1,
              amount: 1,
              status: 1,
            },
          },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 20 }, // Last 20 activities
  ];

  const result = await JobRequest.aggregate(pipeline as any);
  return result || [];
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

    const paymentSuccessRate =
      analytics.payments.totalPayments > 0
        ? (analytics.payments.successfulPayments / analytics.payments.totalPayments) * 100
        : 0;

    // Calculate weighted health score
    const healthScore =
      jobCompletionRate * 0.4 + // 40% weight on job completion
      userApprovalRate * 0.3 + // 30% weight on user approval
      paymentSuccessRate * 0.3; // 30% weight on payment success

    return Math.round(healthScore * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    return 0;
  }
};
