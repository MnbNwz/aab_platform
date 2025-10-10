import { Bid } from "@models/job";
import { Types } from "@models/types";
import { logErrorWithContext } from "@utils/core";
import { checkLeadLimit, getContractorMembership } from "@services/job/contractorJobService";

// Get comprehensive contractor dashboard analytics - OPTIMIZED
export const getContractorAnalytics = async (contractorId: string) => {
  try {
    // Get contractor membership with effective benefits
    const { membership, plan, effectivePlan } = await getContractorMembership(contractorId);

    // Get lead info using the actual service
    const leadInfo = await checkLeadLimit(contractorId);

    // Calculate this month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const contractorObjId = new Types.ObjectId(contractorId);

    // OPTIMIZED: Single aggregation pipeline for all dashboard data
    const [dashboardData] = await Bid.aggregate([
      { $match: { contractor: contractorObjId } },
      {
        $facet: {
          // Overall statistics
          stats: [
            {
              $group: {
                _id: null,
                totalBids: { $sum: 1 },
                acceptedBids: {
                  $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
                },
                pendingBids: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                rejectedBids: {
                  $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                },
                avgBidAmount: { $avg: "$bidAmount" },
                totalEarnings: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "accepted"] }, "$bidAmount", 0],
                  },
                },
              },
            },
          ],
          // This month's bids count
          thisMonth: [{ $match: { createdAt: { $gte: startOfMonth } } }, { $count: "count" }],
          // Recent bids (last 10, sorted by updatedAt)
          recentBids: [
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "jobrequests",
                localField: "jobRequest",
                foreignField: "_id",
                as: "jobRequest",
                pipeline: [{ $project: { title: 1, service: 1, estimate: 1, status: 1 } }],
              },
            },
            {
              $addFields: {
                jobRequest: { $arrayElemAt: ["$jobRequest", 0] },
              },
            },
            {
              $project: {
                _id: 1,
                jobTitle: "$jobRequest.title",
                service: "$jobRequest.service",
                bidAmount: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          // Recent won jobs (last 5 accepted bids)
          recentWonJobs: [
            { $match: { status: "accepted" } },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "jobrequests",
                localField: "jobRequest",
                foreignField: "_id",
                as: "jobRequest",
                pipeline: [{ $project: { title: 1, service: 1, estimate: 1 } }],
              },
            },
            {
              $addFields: {
                jobRequest: { $arrayElemAt: ["$jobRequest", 0] },
              },
            },
            {
              $project: {
                _id: 1,
                jobTitle: "$jobRequest.title",
                service: "$jobRequest.service",
                bidAmount: 1,
                acceptedAt: "$updatedAt",
              },
            },
          ],
        },
      },
    ]);

    // Extract data from aggregation
    const stats = dashboardData.stats[0] || {
      totalBids: 0,
      acceptedBids: 0,
      pendingBids: 0,
      rejectedBids: 0,
      avgBidAmount: 0,
      totalEarnings: 0,
    };
    const bidsThisMonth = dashboardData.thisMonth[0]?.count || 0;
    const recentBids = dashboardData.recentBids || [];
    const recentWonJobs = dashboardData.recentWonJobs || [];

    // Calculate win rate
    const winRate =
      stats.totalBids > 0 ? Math.round((stats.acceptedBids / stats.totalBids) * 1000) / 10 : 0;

    // Build effective membership benefits object
    const membershipBenefits =
      membership && plan
        ? {
            tier: plan.tier,
            planName: plan.name,
            billingPeriod: membership.billingPeriod,
            startDate: membership.startDate,
            endDate: membership.endDate,
            isUpgraded: membership.isUpgraded || false,

            // Contractor Effective Benefits (from effectivePlan which already has effective values)
            leadsPerMonth: effectivePlan.leadsPerMonth,
            accessDelayHours: effectivePlan.accessDelayHours,
            radiusKm: effectivePlan.radiusKm,
            featuredListing: effectivePlan.featuredListing,
            offMarketAccess: effectivePlan.offMarketAccess,
            publicityReferences: effectivePlan.publicityReferences,
            verifiedBadge: effectivePlan.verifiedBadge,
            financingSupport: effectivePlan.financingSupport,
            privateNetwork: effectivePlan.privateNetwork,

            // CRITICAL: Show accumulated leads from upgrades
            accumulatedLeads: effectivePlan.accumulatedLeads,
            bonusLeadsFromUpgrade: effectivePlan.bonusLeadsFromUpgrade,

            // Upgrade tracking
            upgradeHistory: membership.upgradeHistory || [],
          }
        : null;

    // Build final response
    return {
      membership: membershipBenefits,
      biddingStats: {
        totalBids: stats.totalBids,
        totalBidsThisMonth: bidsThisMonth,
        acceptedBids: stats.acceptedBids,
        pendingBids: stats.pendingBids,
        rejectedBids: stats.rejectedBids,
        avgBidAmount: Math.round(stats.avgBidAmount || 0),
        winRate,
      },
      earningsStats: {
        totalEarnings: stats.totalEarnings,
        completedJobs: stats.acceptedBids,
        avgJobValue:
          stats.acceptedBids > 0 ? Math.round(stats.totalEarnings / stats.acceptedBids) : 0,
      },
      leadStats: {
        used: leadInfo.leadsUsed,
        limit: leadInfo.leadsLimit,
        remaining: leadInfo.remaining,
        resetDate: leadInfo.resetDate,
        canBid: leadInfo.canAccess,
      },
      recentBids,
      recentWonJobs,
    };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getContractorAnalytics",
      contractorId,
    });
    throw error;
  }
};
