import { User } from "@models/user";
import { Types } from "@models/types";
import { logErrorWithContext } from "@utils/core";

// Get comprehensive customer dashboard analytics
export const getCustomerAnalytics = async (customerId: string) => {
  try {
    // Single aggregation pipeline to get all customer data
    const pipeline = [
      { $match: { _id: new Types.ObjectId(customerId) } },

      // Get customer's job requests with bid information
      {
        $lookup: {
          from: "jobrequests",
          localField: "_id",
          foreignField: "createdBy",
          as: "jobs",
          pipeline: [
            {
              $lookup: {
                from: "bids",
                localField: "_id",
                foreignField: "jobRequest",
                as: "bids",
              },
            },
            {
              $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "property",
                pipeline: [{ $project: { title: 1, propertyType: 1 } }],
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ["$property", 0] },
                bidCount: { $size: "$bids" },
                avgBidAmount: { $avg: "$bids.bidAmount" },
                acceptedBid: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$bids",
                        cond: { $eq: ["$$this.status", "accepted"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          ],
        },
      },

      // Get customer's payments
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "userId",
          as: "payments",
          pipeline: [
            {
              $lookup: {
                from: "jobrequests",
                localField: "jobRequestId",
                foreignField: "_id",
                as: "job",
                pipeline: [{ $project: { title: 1, service: 1 } }],
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

      // Get customer's properties with job counts
      {
        $lookup: {
          from: "properties",
          localField: "_id",
          foreignField: "userId",
          as: "properties",
          pipeline: [
            {
              $lookup: {
                from: "jobrequests",
                localField: "_id",
                foreignField: "property",
                as: "jobCount",
              },
            },
            {
              $addFields: {
                totalJobs: { $size: "$jobCount" },
              },
            },
            {
              $project: {
                title: 1,
                propertyType: 1,
                address: 1,
                totalJobs: 1,
                createdAt: 1,
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

      // Calculate customer statistics
      {
        $addFields: {
          membership: { $arrayElemAt: ["$membership", 0] },

          // Job statistics
          jobStats: {
            totalJobs: { $size: "$jobs" },
            openJobs: {
              $size: {
                $filter: {
                  input: "$jobs",
                  cond: { $eq: ["$$this.status", "open"] },
                },
              },
            },
            completedJobs: {
              $size: {
                $filter: {
                  input: "$jobs",
                  cond: { $eq: ["$$this.status", "completed"] },
                },
              },
            },
            totalValue: { $sum: "$jobs.estimate" },
            avgJobValue: { $avg: "$jobs.estimate" },
            totalBids: { $sum: "$jobs.bidCount" },
            avgBidsPerJob: { $avg: "$jobs.bidCount" },
          },

          // Payment statistics
          paymentStats: {
            totalPayments: { $size: "$payments" },
            totalAmount: { $sum: "$payments.amount" },
            successfulPayments: {
              $size: {
                $filter: {
                  input: "$payments",
                  cond: { $eq: ["$$this.status", "succeeded"] },
                },
              },
            },
            avgPaymentAmount: { $avg: "$payments.amount" },
          },

          // Property statistics
          propertyStats: {
            totalProperties: { $size: "$properties" },
            totalJobsAcrossProperties: { $sum: "$properties.totalJobs" },
            avgJobsPerProperty: { $avg: "$properties.totalJobs" },
          },
        },
      },

      // Clean up response
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          membership: 1,
          jobStats: 1,
          paymentStats: 1,
          propertyStats: 1,
          recentJobs: { $slice: ["$jobs", 0, 5] }, // Last 5 jobs
          recentPayments: { $slice: ["$payments", 0, 5] }, // Last 5 payments
          recentProperties: { $slice: ["$properties", 0, 3] }, // Last 3 properties
        },
      },
    ];

    const [result] = await User.aggregate(pipeline as any);
    return result || null;
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getCustomerAnalytics",
      customerId,
    });
    throw error;
  }
};
