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

export async function getFeedbackForUser(userId: string): Promise<IFeedback[]> {
  const targetUserId = toObjectId(userId);

  const feedbacks = await Feedback.aggregate([
    {
      $match: {
        toUser: targetUserId,
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
        job: { $arrayElemAt: ["$job", 0] },
      },
    },
  ]);

  return feedbacks as IFeedback[];
}

async function getPendingFeedbackJobsForCustomer(userId: string): Promise<PendingJobSummary[]> {
  const customerId = toObjectId(userId);

  const pipeline = [
    {
      $match: {
        createdBy: customerId,
        status: "completed",
      },
    },
    {
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
    },
    {
      $match: {
        existingFeedback: { $size: 0 },
      },
    },
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
  ];

  const jobs = await JobRequest.aggregate(pipeline as any[]);

  return jobs as PendingJobSummary[];
}

async function getPendingFeedbackJobsForContractor(userId: string): Promise<PendingJobSummary[]> {
  const contractorId = toObjectId(userId);

  const pipeline = [
    {
      $match: {
        contractor: contractorId,
        status: "accepted",
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
            $match: {
              status: "completed",
            },
          },
        ],
      },
    },
    {
      $match: {
        job: { $ne: [] },
      },
    },
    {
      $addFields: {
        job: { $arrayElemAt: ["$job", 0] },
      },
    },
    {
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
    },
    {
      $match: {
        existingFeedback: { $size: 0 },
      },
    },
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
  ];

  const jobs = await Bid.aggregate(pipeline as any[]);

  return jobs as PendingJobSummary[];
}

export async function getPendingFeedbackJobsForCurrentUser(
  userId: string,
  role: "customer" | "contractor",
): Promise<PendingJobSummary[]> {
  if (role === "customer") {
    return getPendingFeedbackJobsForCustomer(userId);
  }

  return getPendingFeedbackJobsForContractor(userId);
}
