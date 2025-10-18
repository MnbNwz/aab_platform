import { JobRequest } from "@models/job";
import { UserMembership } from "@models/user";
import { Payment } from "@models/payment";
import { Bid } from "@models/job";
import { User } from "@models/user";
import { logErrorWithContext } from "@utils/core";

// In-memory cache for analytics (5-minute TTL)
let analyticsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clear analytics cache (call this when critical data changes)
export const clearAnalyticsCache = () => {
  analyticsCache = null;
  console.log("🔄 Analytics cache cleared");
};

// Get comprehensive analytics for admin with caching
// OPTIMIZED: Single database call using MongoDB aggregation framework
export const getAdminAnalytics = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (analyticsCache && now - analyticsCache.timestamp < CACHE_TTL) {
      console.log("📦 Analytics: Returning cached data");
      return analyticsCache.data;
    }

    console.log("⚡ Analytics: Fetching fresh data from database...");
    const startTime = Date.now();

    console.log("  Step 1: Preparing mega pipeline...");

    // CRITICAL OPTIMIZATION: ONE SINGLE PIPELINE
    // Let MongoDB do ALL the work in ONE round-trip
    const currentDate = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0,
      23,
      59,
      59,
    );

    // MEGA PIPELINE: Get everything from JobRequest in ONE query
    console.log("  Step 2: Executing JobRequest mega aggregation...");
    const [analytics] = await JobRequest.aggregate([
      {
        $facet: {
          // 1. Job Revenue Analytics
          jobRevenue: [
            {
              $group: {
                _id: null,
                totalJobsValue: { $sum: "$estimate" },
                completedJobsValue: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$estimate", 0] },
                },
                inProgressValue: {
                  $sum: { $cond: [{ $eq: ["$status", "inprogress"] }, "$estimate", 0] },
                },
                openJobsValue: {
                  $sum: { $cond: [{ $eq: ["$status", "open"] }, "$estimate", 0] },
                },
                cancelledValue: {
                  $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, "$estimate", 0] },
                },
                avgJobValue: { $avg: "$estimate" },
                totalJobs: { $sum: 1 },
                completedJobs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              },
            },
          ],

          // 2. Monthly Revenue (last 12 months)
          monthlyRevenue: [
            { $match: { createdAt: { $gte: twelveMonthsAgo } } },
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  status: "$status",
                },
                count: { $sum: 1 },
                totalValue: { $sum: "$estimate" },
              },
            },
            { $sort: { "_id.year": 1 as const, "_id.month": 1 as const } },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                status: "$_id.status",
                count: 1,
                totalValue: 1,
              },
            },
          ],

          // 3. Service Revenue
          serviceRevenue: [
            {
              $group: {
                _id: { service: "$service", status: "$status" },
                count: { $sum: 1 },
                totalValue: { $sum: "$estimate" },
                avgValue: { $avg: "$estimate" },
              },
            },
            {
              $project: {
                _id: 0,
                service: "$_id.service",
                status: "$_id.status",
                count: 1,
                totalValue: 1,
                avgValue: 1,
              },
            },
          ],

          // 4. Type Revenue
          typeRevenue: [
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalValue: { $sum: "$estimate" },
                avgValue: { $avg: "$estimate" },
              },
            },
            {
              $project: {
                _id: 0,
                type: "$_id",
                count: 1,
                totalValue: 1,
                avgValue: 1,
              },
            },
          ],

          // 5. Current Month Jobs (for growth calculation)
          currentMonthJobs: [
            { $match: { createdAt: { $gte: currentMonth } } },
            { $count: "count" },
          ],

          // 6. Previous Month Jobs (for growth calculation)
          previousMonthJobs: [
            { $match: { createdAt: { $gte: previousMonth, $lte: previousMonthEnd } } },
            { $count: "count" },
          ],
        },
      },
    ] as any);

    console.log("  Step 3: JobRequest aggregation complete");
    console.log("  Step 4: Fetching additional data (memberships, bids, payments, leads)...");

    // Get additional data that can't come from JobRequest
    const [membershipData, bidData, paymentData, userData, leadData, customerData] =
      await Promise.all([
        getMembershipRevenueAnalytics(),
        getContractorPerformanceAnalytics(),
        getPaymentAnalytics(),
        User.countDocuments({ role: "customer" }),
        getLeadAnalytics(),
        getCustomerMetrics(), // Now called separately
      ]);

    console.log("  Step 5: Additional data fetched");
    console.log("  Step 6: Parsing trends data...");

    // Parse job trends
    const currentMonthJobs = analytics.currentMonthJobs[0]?.count || 0;
    const previousMonthJobs = analytics.previousMonthJobs[0]?.count || 0;
    const jobsGrowth =
      previousMonthJobs > 0
        ? ((currentMonthJobs - previousMonthJobs) / previousMonthJobs) * 100
        : currentMonthJobs > 0
          ? 100
          : 0;

    // Get user growth (single query)
    const [userGrowth] = await User.aggregate([
      {
        $facet: {
          current: [{ $match: { createdAt: { $gte: currentMonth } } }, { $count: "count" }],
          previous: [
            { $match: { createdAt: { $gte: previousMonth, $lte: previousMonthEnd } } },
            { $count: "count" },
          ],
        },
      },
    ] as any);

    const currentMonthUsers = userGrowth?.current[0]?.count || 0;
    const previousMonthUsers = userGrowth?.previous[0]?.count || 0;
    const usersGrowth =
      previousMonthUsers > 0
        ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
        : currentMonthUsers > 0
          ? 100
          : 0;

    const result = {
      revenue: {
        jobs: {
          summary: analytics.jobRevenue[0] || {
            totalJobsValue: 0,
            completedJobsValue: 0,
            inProgressValue: 0,
            openJobsValue: 0,
            cancelledValue: 0,
            avgJobValue: 0,
            totalJobs: 0,
            completedJobs: 0,
          },
          monthlyRevenue: analytics.monthlyRevenue || [],
          serviceRevenue: analytics.serviceRevenue || [],
          typeRevenue: analytics.typeRevenue || [],
        },
        memberships: membershipData,
        payments: paymentData,
      },
      performance: {
        contractors: bidData,
        customers: {
          summary: {
            totalCustomers: userData,
            activeCustomers: customerData.summary.activeCustomers,
            avgJobsPerCustomer: customerData.summary.avgJobsPerCustomer,
            avgSpendingPerCustomer: customerData.summary.avgSpendingPerCustomer,
          },
          topCustomers: customerData.topCustomers,
        },
        leads: leadData,
      },
      trends: {
        currentMonth: {
          jobs: currentMonthJobs,
          users: currentMonthUsers,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
        previousMonth: {
          jobs: previousMonthJobs,
          users: previousMonthUsers,
          month: new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
          year:
            new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),
        },
        growth: {
          jobsGrowthPercent: Math.round(jobsGrowth * 100) / 100,
          usersGrowthPercent: Math.round(usersGrowth * 100) / 100,
        },
      },
    };

    // Cache the result
    analyticsCache = {
      data: result,
      timestamp: now,
    };

    const executionTime = Date.now() - startTime;
    console.log(`✅ Analytics: Generated in ${executionTime}ms (cached for 5 minutes)`);

    return result;
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getAdminAnalytics",
    });
    throw error;
  }
};

// Membership Revenue Analytics
const getMembershipRevenueAnalytics = async () => {
  // OPTIMIZATION: Only analyze last 12 months for signup trends
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

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
      $addFields: {
        actualPrice: {
          $cond: {
            if: { $eq: ["$billingPeriod", "yearly"] },
            then: "$plan.yearlyPrice",
            else: "$plan.monthlyPrice",
          },
        },
      },
    },
    {
      $facet: {
        // Overall summary
        summary: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$actualPrice" },
              activeRevenue: {
                $sum: { $cond: [{ $eq: ["$status", "active"] }, "$actualPrice", 0] },
              },
              totalMemberships: { $sum: 1 },
              activeMemberships: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
              avgMembershipValue: { $avg: "$actualPrice" },
            },
          },
        ],

        // Revenue by tier (for charts)
        tierRevenue: [
          {
            $group: {
              _id: "$plan.tier",
              count: { $sum: 1 },
              totalRevenue: { $sum: "$actualPrice" },
              avgRevenue: { $avg: "$actualPrice" },
            },
          },
          {
            $project: {
              _id: 0,
              tier: "$_id",
              count: 1,
              totalRevenue: 1,
              avgRevenue: 1,
            },
          },
        ],

        // Revenue by billing period
        billingRevenue: [
          {
            $group: {
              _id: "$billingPeriod",
              count: { $sum: 1 },
              totalRevenue: { $sum: "$actualPrice" },
            },
          },
          {
            $project: {
              _id: 0,
              billingPeriod: "$_id",
              count: 1,
              totalRevenue: 1,
            },
          },
        ],

        // Monthly signup trends - Last 12 months only
        monthlySignups: [
          {
            $match: { createdAt: { $gte: twelveMonthsAgo } },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                tier: "$plan.tier",
              },
              count: { $sum: 1 },
              revenue: { $sum: "$actualPrice" },
            },
          },
          {
            $sort: { "_id.year": 1 as const, "_id.month": 1 as const },
          },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              tier: "$_id.tier",
              count: 1,
              revenue: 1,
            },
          },
        ],
      },
    },
  ];

  const [result] = await UserMembership.aggregate(pipeline as any);

  return {
    summary: result.summary[0] || {
      totalRevenue: 0,
      activeRevenue: 0,
      totalMemberships: 0,
      activeMemberships: 0,
      avgMembershipValue: 0,
    },
    tierRevenue: result.tierRevenue || [],
    billingRevenue: result.billingRevenue || [],
    monthlySignups: result.monthlySignups || [],
  };
};

// Payment Analytics
const getPaymentAnalytics = async () => {
  try {
    const pipeline = [
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                avgPaymentAmount: { $avg: "$amount" },
                successfulPayments: {
                  $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
                },
                failedPayments: {
                  $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                },
              },
            },
          ],

          // Payment type breakdown
          typeBreakdown: [
            {
              $group: {
                _id: "$type",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            {
              $project: {
                _id: 0,
                type: "$_id",
                count: 1,
                totalAmount: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Payment.aggregate(pipeline as any);

    return {
      summary: result.summary[0] || {
        totalPayments: 0,
        totalAmount: 0,
        avgPaymentAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
      },
      typeBreakdown: result.typeBreakdown || [],
    };
  } catch (error) {
    // Payment collection might not exist or have issues
    console.error("Payment analytics failed:", error);
    return {
      summary: {
        totalPayments: 0,
        totalAmount: 0,
        avgPaymentAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
      },
      typeBreakdown: [],
    };
  }
};

// Contractor Performance Analytics
const getContractorPerformanceAnalytics = async () => {
  const pipeline = [
    {
      $facet: {
        // Bid statistics
        bidStats: [
          {
            $group: {
              _id: "$contractor",
              totalBids: { $sum: 1 },
              acceptedBids: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
              rejectedBids: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
              pendingBids: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
              totalBidValue: { $sum: "$bidAmount" },
              avgBidAmount: { $avg: "$bidAmount" },
            },
          },
          {
            $addFields: {
              winRate: {
                $cond: [
                  { $gt: ["$totalBids", 0] },
                  { $multiply: [{ $divide: ["$acceptedBids", "$totalBids"] }, 100] },
                  0,
                ],
              },
            },
          },
          {
            $sort: { acceptedBids: -1 as const },
          },
          { $limit: 10 }, // Top 10 contractors
        ],

        // Overall contractor metrics
        summary: [
          {
            $group: {
              _id: null,
              totalBids: { $sum: 1 },
              acceptedBids: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
              avgBidAmount: { $avg: "$bidAmount" },
              totalBidValue: { $sum: "$bidAmount" },
            },
          },
          {
            $addFields: {
              avgWinRate: {
                $cond: [
                  { $gt: ["$totalBids", 0] },
                  { $multiply: [{ $divide: ["$acceptedBids", "$totalBids"] }, 100] },
                  0,
                ],
              },
            },
          },
        ],
      },
    },
  ];

  const [result] = await Bid.aggregate(pipeline as any);

  return {
    summary: result.summary[0] || {
      totalBids: 0,
      acceptedBids: 0,
      avgBidAmount: 0,
      totalBidValue: 0,
      avgWinRate: 0,
    },
    topContractors: result.bidStats || [],
  };
};

// Lead Analytics (Contractor behavior)
const getLeadAnalytics = async () => {
  try {
    const { LeadAccess } = await import("@models/job/leadAccess");

    // OPTIMIZATION: Only analyze last 12 months for trends
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const pipeline = [
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalLeadsUsed: { $sum: 1 },
                basicTierLeads: {
                  $sum: { $cond: [{ $eq: ["$membershipTier", "basic"] }, 1, 0] },
                },
                standardTierLeads: {
                  $sum: { $cond: [{ $eq: ["$membershipTier", "standard"] }, 1, 0] },
                },
                premiumTierLeads: {
                  $sum: { $cond: [{ $eq: ["$membershipTier", "premium"] }, 1, 0] },
                },
              },
            },
          ],

          // Monthly lead usage trend - Last 12 months only
          monthlyLeadUsage: [
            {
              $match: { accessedAt: { $gte: twelveMonthsAgo } },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$accessedAt" },
                  month: { $month: "$accessedAt" },
                  tier: "$membershipTier",
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: { "_id.year": 1 as const, "_id.month": 1 as const },
            },
            {
              $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                tier: "$_id.tier",
                count: 1,
              },
            },
          ],

          // Lead conversion rate (leads to accepted bids)
          conversionRate: [
            {
              $lookup: {
                from: "bids",
                localField: "bid",
                foreignField: "_id",
                as: "bidInfo",
              },
            },
            {
              $addFields: {
                bidInfo: { $arrayElemAt: ["$bidInfo", 0] },
              },
            },
            {
              $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                convertedLeads: {
                  $sum: { $cond: [{ $eq: ["$bidInfo.status", "accepted"] }, 1, 0] },
                },
              },
            },
            {
              $addFields: {
                conversionRate: {
                  $cond: [
                    { $gt: ["$totalLeads", 0] },
                    { $multiply: [{ $divide: ["$convertedLeads", "$totalLeads"] }, 100] },
                    0,
                  ],
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await LeadAccess.aggregate(pipeline as any);

    return {
      summary: result.summary[0] || {
        totalLeadsUsed: 0,
        basicTierLeads: 0,
        standardTierLeads: 0,
        premiumTierLeads: 0,
      },
      monthlyLeadUsage: result.monthlyLeadUsage || [],
      conversionRate: result.conversionRate[0] || {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
      },
    };
  } catch (error) {
    console.error("Lead analytics failed:", error);
    return {
      summary: {
        totalLeadsUsed: 0,
        basicTierLeads: 0,
        standardTierLeads: 0,
        premiumTierLeads: 0,
      },
      monthlyLeadUsage: [],
      conversionRate: {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
      },
    };
  }
};

// Customer Metrics - Separate query to avoid nested $facet
const getCustomerMetrics = async () => {
  const pipeline = [
    {
      $group: {
        _id: "$createdBy",
        totalJobs: { $sum: 1 },
        totalSpending: { $sum: "$estimate" },
      },
    },
    {
      $sort: { totalSpending: -1 as const },
    },
  ];

  const customerStats = await JobRequest.aggregate(pipeline as any);

  // Calculate summary
  const activeCustomers = customerStats.length;
  const avgJobsPerCustomer =
    activeCustomers > 0
      ? customerStats.reduce((sum, c) => sum + c.totalJobs, 0) / activeCustomers
      : 0;
  const avgSpendingPerCustomer =
    activeCustomers > 0
      ? customerStats.reduce((sum, c) => sum + c.totalSpending, 0) / activeCustomers
      : 0;

  // Get top 10 customers with user info
  const topCustomersWithUsers = await Promise.all(
    customerStats.slice(0, 10).map(async (customer) => {
      const user = await User.findById(customer._id).select("email firstName lastName").lean();
      return {
        _id: user?._id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        totalJobs: customer.totalJobs,
        totalSpending: customer.totalSpending,
      };
    }),
  );

  return {
    summary: {
      activeCustomers,
      avgJobsPerCustomer,
      avgSpendingPerCustomer,
    },
    topCustomers: topCustomersWithUsers,
  };
};
