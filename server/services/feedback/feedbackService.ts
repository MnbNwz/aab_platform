import { Types } from "mongoose";
import { Feedback } from "@models/feedback";
import { JobRequest } from "@models/job/jobRequest";
import { Bid } from "@models/job";
import { IFeedback } from "@models/types/feedback";
import { toObjectId } from "@utils/core";

export interface CreateFeedbackInput {
  jobRequestId: string;
  fromUserId: string;
  fromRole: "customer" | "contractor";
  rating: number;
  comment?: string;
}

export interface PendingJobSummary {
  _id: Types.ObjectId;
  title: string;
  service: string;
  estimate: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function createFeedbackForJob(input: CreateFeedbackInput): Promise<IFeedback> {
  const { jobRequestId, fromUserId, fromRole, rating, comment } = input;

  const job = await JobRequest.findById(jobRequestId).select("createdBy status acceptedBid").lean();

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.status !== "completed") {
    throw new Error("JOB_NOT_COMPLETED");
  }

  let toUserId: string;

  if (!job.acceptedBid) {
    throw new Error("JOB_HAS_NO_ACCEPTED_BID");
  }

  const bid = await Bid.findById(job.acceptedBid).select("contractor").lean();

  if (!bid || !bid.contractor) {
    throw new Error("BID_NOT_FOUND_FOR_JOB");
  }

  const jobCreatorId = job.createdBy.toString();
  const contractorId = bid.contractor.toString();

  if (fromRole === "customer") {
    if (jobCreatorId !== fromUserId) {
      throw new Error("ONLY_JOB_CUSTOMER_CAN_REVIEW");
    }
    toUserId = contractorId;
  } else {
    if (contractorId !== fromUserId) {
      throw new Error("ONLY_ACCEPTED_CONTRACTOR_CAN_REVIEW");
    }
    toUserId = jobCreatorId;
  }

  const existing = await Feedback.findOne({
    jobRequest: new Types.ObjectId(jobRequestId),
    fromUser: new Types.ObjectId(fromUserId),
    toUser: new Types.ObjectId(toUserId),
  }).lean();

  if (existing) {
    throw new Error("FEEDBACK_ALREADY_EXISTS");
  }

  const feedback = await Feedback.create({
    jobRequest: new Types.ObjectId(jobRequestId),
    fromUser: new Types.ObjectId(fromUserId),
    toUser: new Types.ObjectId(toUserId),
    fromRole,
    rating,
    comment,
  });

  return feedback;
}

export async function getFeedbackForUser(
  userId: string,
  paginationParams?: PaginationParams,
): Promise<PaginatedResponse<IFeedback>> {
  const targetUserId = toObjectId(userId);
  const page = paginationParams?.page && paginationParams.page > 0 ? paginationParams.page : 1;
  const limit = paginationParams?.limit && paginationParams.limit > 0 ? paginationParams.limit : 10;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    {
      $match: {
        toUser: targetUserId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "fromUser",
        foreignField: "_id",
        as: "fromUserDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              role: 1,
              email: 1,
              phone: 1,
              status: 1,
              geoHome: 1,
              customer: 1,
              contractor: 1,
              approval: 1,
              profileImage: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "jobrequests",
        localField: "jobRequest",
        foreignField: "_id",
        as: "job",
        pipeline: [
          {
            $project: {
              _id: 1,
              title: 1,
              service: 1,
              estimate: 1,
              status: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        fromUser: { $arrayElemAt: ["$fromUserDetails", 0] },
        job: { $arrayElemAt: ["$job", 0] },
      },
    },
    {
      $project: {
        fromUserDetails: 0,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ];

  // Get total count
  const countPipeline = [
    {
      $match: {
        toUser: targetUserId,
      },
    },
    {
      $count: "total",
    },
  ];

  const [countResult] = await Feedback.aggregate(countPipeline);
  const total = countResult?.total || 0;

  // Add pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  const feedbacks = await Feedback.aggregate(pipeline);

  return {
    data: feedbacks as IFeedback[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPendingFeedbackJobsForCustomer(
  userId: string,
  paginationParams?: PaginationParams,
): Promise<PaginatedResponse<PendingJobSummary>> {
  const customerId = toObjectId(userId);
  const page = paginationParams?.page && paginationParams.page > 0 ? paginationParams.page : 1;
  const limit = paginationParams?.limit && paginationParams.limit > 0 ? paginationParams.limit : 10;
  const skip = (page - 1) * limit;

  const matchStage = {
    $match: {
      createdBy: customerId,
      status: "completed",
    },
  };

  const lookupStage = {
    $lookup: {
      from: "feedbacks",
      let: {
        jobId: "$_id",
        fromUserId: customerId,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [{ $eq: ["$jobRequest", "$$jobId"] }, { $eq: ["$fromUser", "$$fromUserId"] }],
            },
          },
        },
        { $limit: 1 },
      ],
      as: "existingFeedback",
    },
  };

  const filterStage = {
    $match: {
      existingFeedback: { $size: 0 },
    },
  };

  // Count pipeline
  const countPipeline = [matchStage, lookupStage, filterStage, { $count: "total" }];

  const [countResult] = await JobRequest.aggregate(countPipeline as any[]);
  const total = countResult?.total || 0;

  // Data pipeline
  const pipeline = [
    matchStage,
    lookupStage,
    filterStage,
    {
      $project: {
        _id: 1,
        title: 1,
        service: 1,
        estimate: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const jobs = await JobRequest.aggregate(pipeline as any[]);

  return {
    data: jobs as PendingJobSummary[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPendingFeedbackJobsForContractor(
  userId: string,
  paginationParams?: PaginationParams,
): Promise<PaginatedResponse<PendingJobSummary>> {
  const contractorId = toObjectId(userId);
  const page = paginationParams?.page && paginationParams.page > 0 ? paginationParams.page : 1;
  const limit = paginationParams?.limit && paginationParams.limit > 0 ? paginationParams.limit : 10;
  const skip = (page - 1) * limit;

  const matchBidStage = {
    $match: {
      contractor: contractorId,
      status: "accepted",
    },
  };

  const lookupJobStage = {
    $lookup: {
      from: "jobrequests",
      localField: "jobRequest",
      foreignField: "_id",
      as: "job",
      pipeline: [
        {
          $match: {
            status: "completed",
          },
        },
      ],
    },
  };

  const matchJobExistsStage = {
    $match: {
      job: { $ne: [] },
    },
  };

  const addJobFieldStage = {
    $addFields: {
      job: { $arrayElemAt: ["$job", 0] },
    },
  };

  const lookupFeedbackStage = {
    $lookup: {
      from: "feedbacks",
      let: {
        jobId: "$job._id",
        fromUserId: contractorId,
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [{ $eq: ["$jobRequest", "$$jobId"] }, { $eq: ["$fromUser", "$$fromUserId"] }],
            },
          },
        },
        { $limit: 1 },
      ],
      as: "existingFeedback",
    },
  };

  const matchNoFeedbackStage = {
    $match: {
      existingFeedback: { $size: 0 },
    },
  };

  // Count pipeline
  const countPipeline = [
    matchBidStage,
    lookupJobStage,
    matchJobExistsStage,
    addJobFieldStage,
    lookupFeedbackStage,
    matchNoFeedbackStage,
    { $count: "total" },
  ];

  const [countResult] = await Bid.aggregate(countPipeline as any[]);
  const total = countResult?.total || 0;

  // Data pipeline
  const pipeline = [
    matchBidStage,
    lookupJobStage,
    matchJobExistsStage,
    addJobFieldStage,
    lookupFeedbackStage,
    matchNoFeedbackStage,
    {
      $project: {
        _id: "$job._id",
        title: "$job.title",
        service: "$job.service",
        estimate: "$job.estimate",
        status: "$job.status",
        createdAt: "$job.createdAt",
        updatedAt: "$job.updatedAt",
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const jobs = await Bid.aggregate(pipeline as any[]);

  return {
    data: jobs as PendingJobSummary[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPendingFeedbackJobsForCurrentUser(
  userId: string,
  role: "customer" | "contractor",
  paginationParams?: PaginationParams,
): Promise<PaginatedResponse<PendingJobSummary>> {
  if (role === "customer") {
    return getPendingFeedbackJobsForCustomer(userId, paginationParams);
  }

  return getPendingFeedbackJobsForContractor(userId, paginationParams);
}
