import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as jobRequestService from "@services/jobRequestService";

const ALLOWED_TYPES = ["regular", "off_market", "commercial"];

// Create a new job request (regular or off-market)
export const createJobRequest = async (req: Request & { files?: any[] }, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest & { files?: any[] };
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Parse form fields
    const { property, title, description, service, estimate, type, timeline } = req.body;

    // Validate job type
    if (type && !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid job type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // Only admin can create off_market jobs
    if (type === "off_market" && authReq.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Only admin can create off-market jobs" });
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
    console.error("Error creating job request:", error);

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create job request",
      error: process.env.NODE_ENV === "development" ? (error as any)?.message : undefined,
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
    console.error("Error fetching job requests:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job requests" });
  }
};

// Get a single job request by ID
export const getJobRequestById = async (req: Request, res: Response) => {
  try {
    const job = await jobRequestService.getJobRequestById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (error) {
    console.error("Error fetching job request:", error);
    res.status(500).json({ success: false, message: "Failed to fetch job request" });
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
    console.error("Error updating job request:", error);

    if (error instanceof Error) {
      if (error.message === "Job not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === "Forbidden") {
        return res.status(403).json({ success: false, message: error.message });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to update job request" });
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
      message: "Job cancelled successfully",
      job: job,
    });
  } catch (error) {
    console.error("Error cancelling job request:", error);

    if (error instanceof Error) {
      if (error.message === "Job not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("Only job creator or admin")) {
        return res.status(403).json({ success: false, message: error.message });
      }
      if (error.message.includes("Cannot cancel") || error.message.includes("already cancelled")) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }

    res.status(500).json({ success: false, message: "Failed to cancel job request" });
  }
};
