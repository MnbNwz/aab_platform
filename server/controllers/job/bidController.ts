import { Request, Response } from "express";
import { Bid } from "@models/job";
import { JobRequest } from "@models/job";
import { LeadAccess } from "@models/job/leadAccess";
import { toObjectId } from "@utils/core";
import {
  CONTROLLER_ERROR_MESSAGES,
  HTTP_STATUS,
  CONTROLLER_CONSTANTS,
  FIELD_CONSTANTS,
} from "../constants";
import {
  checkLeadLimit,
  incrementLeadUsage,
  getContractorMembership,
  canAccessJob,
} from "@services/job/contractorJobService";

// Create a new bid - THIS CONSUMES 1 LEAD
export const createBid = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { jobRequestId, bidAmount, message, timeline, materials, warranty } = req.body;
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    // Validate required fields
    if (!jobRequestId || !bidAmount || !message || !timeline) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
      });
    }

    // Validate bid amount
    if (typeof bidAmount !== CONTROLLER_CONSTANTS.NUMBER_TYPE || bidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.BID_AMOUNT_MUST_BE_POSITIVE,
      });
    }

    // Validate timeline
    if (!timeline.startDate || !timeline.endDate) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.START_END_DATE_REQUIRED,
      });
    }

    // Check if job request exists and is open
    const jobRequest = await JobRequest.findById(jobRequestId);
    if (!jobRequest) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_REQUEST_NOT_FOUND });
    }

    if (jobRequest.status !== CONTROLLER_CONSTANTS.OPEN_STATUS) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.JOB_NO_LONGER_ACCEPTING_BIDS,
      });
    }

    // CRITICAL: Check if contractor already bid on this job
    const existingBid = await Bid.findOne({
      jobRequest: jobRequestId,
      contractor: contractorId,
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.BID_ALREADY_PLACED,
      });
    }

    // CRITICAL: Check if contractor can access this job (timing check)
    const accessCheck = await canAccessJob(
      contractorId.toString(),
      jobRequestId,
      jobRequest.createdAt,
    );
    if (!accessCheck.canAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: accessCheck.reason,
        accessTime: accessCheck.accessTime,
      });
    }

    // CRITICAL: Check lead limit BEFORE creating bid
    const leadCheck = await checkLeadLimit(contractorId.toString());
    if (!leadCheck.canAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Lead limit reached. ${leadCheck.reason}`,
        leadInfo: leadCheck,
      });
    }

    // OPTIMIZATION: Get membership info for lead tracking
    const { effectivePlan } = await getContractorMembership(contractorId.toString());
    const membershipTier = effectivePlan.tier.toLowerCase() as "basic" | "standard" | "premium";

    // Create the bid first
    const bid = await Bid.create({
      jobRequest: jobRequestId,
      contractor: contractorId,
      bidAmount,
      message,
      timeline,
      materials: materials || { included: false },
      warranty: warranty || { period: undefined, description: undefined },
    });

    // CRITICAL: Record lead consumption and update job request in parallel
    // If ANY operation fails, we rollback the bid creation
    try {
      await Promise.all([
        // Track lead consumption
        new LeadAccess({
          contractor: contractorId,
          jobRequest: jobRequestId,
          bid: bid._id,
          membershipTier,
        }).save(),
        // Increment lead counter
        incrementLeadUsage(contractorId.toString()),
        // Add bid to job request
        JobRequest.findByIdAndUpdate(jobRequestId, {
          $push: { bids: bid._id },
        }),
      ]);
    } catch (parallelError) {
      // ROLLBACK: Delete the bid if any parallel operation failed
      console.error("Parallel operations failed, rolling back bid:", parallelError);
      await Bid.findByIdAndDelete(bid._id);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to complete bid placement. Please try again.",
      });
    }

    // Get updated lead info
    const updatedLeadCheck = await checkLeadLimit(contractorId.toString());

    res.status(201).json({
      success: true,
      message: "Bid placed successfully. 1 lead consumed.",
      data: {
        bid,
        leadInfo: updatedLeadCheck,
      },
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.BID_CREATION_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Get all bids for a job request
export const getJobBids = async (req: Request, res: Response) => {
  try {
    const { jobRequestId } = req.params;

    const bids = await Bid.find({ jobRequest: jobRequestId })
      .populate(
        "contractor",
        `firstName lastName ${FIELD_CONSTANTS.EMAIL} ${FIELD_CONSTANTS.PHONE} profileImage role status approval geoHome contractor`,
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bids });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.BID_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Get contractor's bids with filtering
export const getContractorBids = async (req: Request & { user?: any }, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    // Build filter query with proper ObjectId conversion
    const query: any = { contractor: toObjectId(contractorId.toString()) };

    // Filter by bid status (pending, accepted, rejected)
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Bid.countDocuments(query);

    // Get bids with full job details using aggregation
    const bids = await Bid.aggregate([
      { $match: query },
      { $sort: { updatedAt: -1 } }, // Most recently updated first
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "jobrequests",
          localField: "jobRequest",
          foreignField: "_id",
          as: "jobRequest",
          pipeline: [
            {
              $lookup: {
                from: "properties",
                localField: "property",
                foreignField: "_id",
                as: "property",
                pipeline: [
                  {
                    $project: {
                      title: 1,
                      location: 1,
                      area: 1,
                      areaUnit: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                property: { $arrayElemAt: ["$property", 0] },
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                service: 1,
                estimate: 1,
                timeline: 1,
                status: 1,
                property: 1,
                location: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          jobRequest: { $arrayElemAt: ["$jobRequest", 0] },
        },
      },
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        bids,
        total,
        pagination: {
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.CONTRACTOR_BID_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};
