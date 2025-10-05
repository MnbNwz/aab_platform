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

// Get a specific job for contractor (with access validation)
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

    // ENHANCEMENT: Check if job was already accessed
    const existingAccess = await LeadAccess.findOne({
      contractor: userId,
      jobRequest: jobId,
    });

    if (existingAccess) {
      // Job already accessed, return without consuming lead
      const leadCheck = await checkLeadLimit(userId);

      res.json({
        success: true,
        data: {
          job,
          leadInfo: leadCheck,
          accessInfo: {
            alreadyAccessed: true,
            accessedAt: existingAccess.accessedAt,
            membershipTier: existingAccess.membershipTier,
          },
        },
      });
      return;
    }

    // Check if contractor can access this job
    const accessCheck = await canAccessJob(userId, jobId, job.createdAt);
    if (!accessCheck.canAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: accessCheck.reason,
        accessTime: accessCheck.accessTime,
      });
    }

    // Check lead limit
    const leadCheck = await checkLeadLimit(userId);
    if (!leadCheck.canAccess) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: leadCheck.reason,
        leadInfo: leadCheck,
      });
    }

    // OPTIMIZATION 5: Record access with parallel operations
    const { effectivePlan } = await getContractorMembership(userId);
    const membershipTier = effectivePlan.tier.toLowerCase();

    // Parallel operations for better performance
    const [leadAccess] = await Promise.all([
      // Create lead access record
      new LeadAccess({
        contractor: userId,
        jobRequest: jobId,
        membershipTier,
      }).save(),
      // Increment fast counter
      incrementLeadUsage(userId),
    ]);

    // Get updated lead info
    const updatedLeadCheck = await checkLeadLimit(userId);

    res.json({
      success: true,
      data: {
        job,
        leadInfo: updatedLeadCheck,
        accessInfo: {
          alreadyAccessed: false,
          accessedAt: leadAccess.accessedAt,
          membershipTier: leadAccess.membershipTier,
        },
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

// Check if contractor can access a specific job (without consuming lead)
export const checkContractorJobAccess = async (req: Request, res: Response) => {
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

    // Check if contractor can access this job
    const accessCheck = await canAccessJob(userId, jobId, job.createdAt);
    const leadCheck = await checkLeadLimit(userId);

    // Check if already accessed
    const existingAccess = await LeadAccess.findOne({
      contractor: userId,
      jobRequest: jobId,
    });

    const canAccess = accessCheck.canAccess && leadCheck.canAccess;
    const alreadyAccessed = !!existingAccess;

    res.json({
      success: true,
      data: {
        canAccess: canAccess || alreadyAccessed, // Can access if available or already accessed
        alreadyAccessed,
        accessCheck,
        leadCheck,
        accessInfo: existingAccess
          ? {
              accessedAt: existingAccess.accessedAt,
              membershipTier: existingAccess.membershipTier,
            }
          : null,
        job: {
          id: job._id,
          title: job.title,
          createdAt: job.createdAt,
          type: job.type,
        },
      },
    });
  } catch (error) {
    console.error("Error checking job access:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to check job access",
    });
  }
};
