import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as jobRequestService from "@services/job/job";

import {
  ALLOWED_JOB_TYPES,
  CONTROLLER_ERROR_MESSAGES,
  HTTP_STATUS,
} from "@controllers/constants/validation";

// Create a new job request (regular or off-market)
export const createJobRequest = async (req: Request & { files?: any[] }, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest & { files?: any[] };
    const userId = authReq.user?._id;
    if (!userId)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });

    // Parse form fields
    const { property, title, description, service, estimate, type, timeline } = req.body;

    // Validate job type
    if (type && !ALLOWED_JOB_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job type. Allowed types: ${ALLOWED_JOB_TYPES.join(", ")}`,
      });
    }

    // Only admin can create off_market jobs
    if (type === "off_market" && authReq.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.ADMIN_ONLY_OFF_MARKET });
    }

    // Create job using service
    const job = await jobRequestService.createJobRequest({
      createdBy: authReq.user._id,
      property,
      title,
      description,
      service,
      estimate: estimate ? Number(estimate) : undefined,
      type: type || "regular",
      timeline: timeline ? Number(timeline) : undefined,
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.JOB_CREATION_ERROR, error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: CONTROLLER_ERROR_MESSAGES.JOB_CREATION_FAILED,
      error: (error as any)?.message,
    });
  }
};

// Get all job requests (admin: all, user: own, contractor: visible)
export const getJobRequests = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const filters = req.query;

    // Get jobs using service
    const result = await jobRequestService.getJobRequests(filters, user);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.JOB_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_FETCH_FAILED });
  }
};

// Get a single job request by ID
export const getJobRequestById = async (req: Request, res: Response) => {
  try {
    const job = await jobRequestService.getJobRequestById(req.params.id);
    if (!job)
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_NOT_FOUND });
    res.json({ success: true, job });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.JOB_REQUEST_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_REQUEST_FETCH_FAILED });
  }
};

// Update a job request (only by creator or admin)
export const updateJobRequest = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    // Update job using service
    const job = await jobRequestService.updateJobRequest(req.params.id, req.body, user);

    res.json({ success: true, job });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.JOB_UPDATE_ERROR, error);

    if (error instanceof Error) {
      if (error.message === CONTROLLER_ERROR_MESSAGES.JOB_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: error.message });
      }
      if (error.message === CONTROLLER_ERROR_MESSAGES.FORBIDDEN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
      }
      if (
        error.message.includes("Cannot edit job") ||
        error.message.includes("bid has already been accepted")
      ) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
      }
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
    }

    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_UPDATE_FAILED });
  }
};

// Cancel a job request (only by creator or admin)
export const cancelJobRequest = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    // Cancel job using service
    const job = await jobRequestService.cancelJobRequest(req.params.id, user);

    res.json({
      success: true,
      message: CONTROLLER_ERROR_MESSAGES.JOB_CANCELLED_SUCCESS,
      job: job,
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.JOB_CANCEL_ERROR, error);

    if (error instanceof Error) {
      if (error.message === CONTROLLER_ERROR_MESSAGES.JOB_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: error.message });
      }
      if (error.message.includes("Only job creator or admin")) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: error.message });
      }
      if (error.message.includes("Cannot cancel") || error.message.includes("already cancelled")) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
      }
    }

    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.JOB_CANCEL_FAILED });
  }
};
