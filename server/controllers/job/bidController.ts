import { Request, Response } from "express";
import { Bid } from "@models/job";
import { JobRequest } from "@models/job";
import {
  CONTROLLER_ERROR_MESSAGES,
  HTTP_STATUS,
  CONTROLLER_CONSTANTS,
  FIELD_CONSTANTS,
} from "../constants";

// Create a new bid
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

    // Check if contractor already bid on this job
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

    // Create the bid
    const bid = await Bid.create({
      jobRequest: jobRequestId,
      contractor: contractorId,
      bidAmount,
      message,
      timeline,
      materials: materials || { included: false },
      warranty: warranty || { period: undefined, description: undefined },
    });

    // Add bid to job request
    await JobRequest.findByIdAndUpdate(jobRequestId, {
      $push: { bids: bid._id },
    });

    res.status(201).json({ success: true, data: bid });
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
        `${FIELD_CONSTANTS.NAME} ${FIELD_CONSTANTS.EMAIL} ${FIELD_CONSTANTS.PHONE}`,
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

// Accept a bid
export const acceptBid = async (req: Request & { user?: any }, res: Response) => {
  try {
    const { bidId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    // Find the bid
    const bid = await Bid.findById(bidId).populate("jobRequest");
    if (!bid) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.BID_NOT_FOUND });
    }

    const jobRequest = bid.jobRequest as any; // Type assertion for populated field

    // Check if user is the job creator
    if (jobRequest.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
      });
    }

    // Check if job is still open
    if (jobRequest.status !== CONTROLLER_CONSTANTS.OPEN_STATUS) {
      return res.status(400).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.JOB_NO_LONGER_ACCEPTING_BIDS,
      });
    }

    // Update bid status to accepted
    await Bid.findByIdAndUpdate(bidId, { status: CONTROLLER_CONSTANTS.ACCEPTED_STATUS });

    // Reject all other bids for this job
    await Bid.updateMany(
      {
        jobRequest: jobRequest._id,
        _id: { $ne: bidId },
      },
      { status: CONTROLLER_CONSTANTS.REJECTED_STATUS },
    );

    // Update job request
    await JobRequest.findByIdAndUpdate(jobRequest._id, {
      acceptedBid: bidId,
      status: CONTROLLER_CONSTANTS.INPROGRESS_STATUS,
      $push: {
        timelineHistory: {
          status: CONTROLLER_CONSTANTS.ACCEPTED_STATUS,
          date: new Date(),
          by: userId,
        },
      },
    });

    res.json({ success: true, message: CONTROLLER_ERROR_MESSAGES.BID_ACCEPTED_SUCCESS });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.BID_ACCEPT_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Get contractor's bids
export const getContractorBids = async (req: Request & { user?: any }, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const bids = await Bid.find({ contractor: contractorId })
      .populate(
        "jobRequest",
        `${FIELD_CONSTANTS.TITLE} ${FIELD_CONSTANTS.DESCRIPTION} ${FIELD_CONSTANTS.STATUS}`,
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bids });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.CONTRACTOR_BID_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};
