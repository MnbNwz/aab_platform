import { User } from "@models/user";
import { Types } from "@models/types";
import { logErrorWithContext } from "@utils/core";
import { getCurrentPeriod } from "../job/leads";

// Import membership limits from leads service
const MEMBERSHIP_LIMITS = {
  basic: { leads: 25, delayHours: 24 },
  standard: { leads: 40, delayHours: 12 },
  premium: { leads: -1, delayHours: 0 },
};

// Get comprehensive contractor dashboard analytics
export const getContractorAnalytics = async (contractorId: string) => {
  try {
    const { month, year } = getCurrentPeriod();

    // Single aggregation pipeline to get all contractor data
    const pipeline = [
      { $match: { _id: new Types.ObjectId(contractorId) } },

      // Get all bids by this contractor with job details
      {
        $lookup: {
          from: "bids",
          localField: "_id",
          foreignField: "contractor",
          as: "allBids",
          pipeline: [
            {
              $lookup: {
                from: "jobrequests",
                localField: "jobRequest",
                foreignField: "_id",
                as: "job",
                pipeline: [
                  {
                    $project: {
                      title: 1,
                      service: 1,
                      estimate: 1,
                      status: 1,
                      createdAt: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                job: { $arrayElemAt: ["$job", 0] },
              },
            },
          ],
        },
      },

      // Get membership information
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

      // Get lead usage for current month
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

      // Get jobs where contractor was accepted (earnings)
      {
        $lookup: {
          from: "jobrequests",
          let: { contractorId: "$_id" },
          pipeline: [
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
                          { $eq: ["$contractor", "$$contractorId"] },
                          { $eq: ["$status", "accepted"] },
                        ],
                      },
                    },
                  },
                ],
                as: "acceptedBid",
              },
            },
            {
              $match: {
                $expr: { $gt: [{ $size: "$acceptedBid" }, 0] },
              },
            },
            {
              $addFields: {
                acceptedBid: { $arrayElemAt: ["$acceptedBid", 0] },
              },
            },
          ],
          as: "wonJobs",
        },
      },

      // Calculate comprehensive contractor metrics
      {
        $addFields: {
          membership: { $arrayElemAt: ["$membership", 0] },
          leadUsage: { $ifNull: [{ $arrayElemAt: ["$leadUsage.used", 0] }, 0] },

          // Bidding performance
          biddingStats: {
            totalBids: { $size: "$allBids" },
            acceptedBids: {
              $size: {
                $filter: {
                  input: "$allBids",
                  cond: { $eq: ["$$this.status", "accepted"] },
                },
              },
            },
            pendingBids: {
              $size: {
                $filter: {
                  input: "$allBids",
                  cond: { $eq: ["$$this.status", "pending"] },
                },
              },
            },
            rejectedBids: {
              $size: {
                $filter: {
                  input: "$allBids",
                  cond: { $eq: ["$$this.status", "rejected"] },
                },
              },
            },
            avgBidAmount: { $avg: "$allBids.bidAmount" },
            winRate: {
              $cond: [
                { $gt: [{ $size: "$allBids" }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $size: {
                            $filter: {
                              input: "$allBids",
                              cond: { $eq: ["$$this.status", "accepted"] },
                            },
                          },
                        },
                        { $size: "$allBids" },
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },

          // Earnings performance
          earningsStats: {
            totalEarnings: { $sum: "$wonJobs.acceptedBid.bidAmount" },
            completedJobs: { $size: "$wonJobs" },
            avgJobValue: { $avg: "$wonJobs.acceptedBid.bidAmount" },
            totalJobValue: { $sum: "$wonJobs.estimate" },
          },

          // Lead performance (will be calculated after aggregation)
          leadStats: {
            monthlyUsed: "$leadUsage",
            membershipTier: "$membership.plan.tier",
          },
        },
      },

      // Final projection
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          contractor: 1,
          membership: 1,
          biddingStats: 1,
          earningsStats: 1,
          leadStats: 1,
          recentBids: { $slice: ["$allBids", 0, 10] }, // Last 10 bids
          recentWonJobs: { $slice: ["$wonJobs", 0, 5] }, // Last 5 won jobs
        },
      },
    ];

    const [result] = await User.aggregate(pipeline as any);

    if (!result) {
      return null;
    }

    // Calculate lead limits based on membership tier
    const membershipTier = result.leadStats?.membershipTier || "basic";
    const limits = MEMBERSHIP_LIMITS[membershipTier as keyof typeof MEMBERSHIP_LIMITS];

    // Update lead stats with calculated limits
    if (result.leadStats && limits) {
      result.leadStats.monthlyLimit = limits.leads;
      result.leadStats.monthlyRemaining =
        limits.leads === -1 ? -1 : Math.max(0, limits.leads - (result.leadStats.monthlyUsed || 0));
    } else if (result.leadStats) {
      // Fallback to basic limits if membership tier is invalid
      const basicLimits = MEMBERSHIP_LIMITS.basic;
      result.leadStats.monthlyLimit = basicLimits.leads;
      result.leadStats.monthlyRemaining = Math.max(
        0,
        basicLimits.leads - (result.leadStats.monthlyUsed || 0),
      );
    }

    return result;
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getContractorAnalytics",
      contractorId,
    });
    throw error;
  }
};
