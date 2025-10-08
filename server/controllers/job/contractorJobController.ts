import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import {
  getJobsForContractor,
  canAccessJob,
  checkLeadLimit,
  incrementLeadUsage,
  getContractorMembership,
} from "@services/job/contractorJobService";
import { getJobRequestById } from "@services/job/job";
import { LeadAccess } from "@models/job/leadAccess";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants/validation";

// Get jobs for contractor with membership-based filtering
export const getContractorJobs = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    // Check if user is contractor
    if (authReq.user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "This endpoint is only available for contractors",
      });
    }

    const filters = req.query;
    const result = await getJobsForContractor(userId, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting contractor jobs:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch contractor jobs",
    });
  }
};

// Get a specific job for contractor (returns job details + bid status)
export const getContractorJobById = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    // Check if user is contractor
    if (authReq.user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "This endpoint is only available for contractors",
      });
    }

    // Get the job
    const job = await getJobRequestById(jobId);
    if (!job) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if contractor already bid on this job
    const existingBid = await LeadAccess.findOne({
      contractor: userId,
      jobRequest: jobId,
    }).populate("bid");

    res.json({
      success: true,
      data: {
        ...job,
        alreadyBid: !!existingBid, // True if contractor already placed a bid
      },
    });
  } catch (error) {
    console.error("Error getting contractor job by ID:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
};
