import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as leadAccessService from "@services/job/leads";

// Get contractor's lead usage and available job requests
export const getContractorLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { page = 1, limit = 10, service, propertyType, minEstimate, maxEstimate } = req.query;

    const filters = {
      service,
      propertyType,
      minEstimate: minEstimate ? Number(minEstimate) : undefined,
      maxEstimate: maxEstimate ? Number(maxEstimate) : undefined,
    };

    const result = await leadAccessService.getFilteredJobRequests(contractorId, filters);

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedJobRequests = result.jobRequests.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        jobRequests: paginatedJobRequests,
        leadUsage: result.leadUsage,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(result.jobRequests.length / Number(limit)),
          totalItems: result.jobRequests.length,
          itemsPerPage: Number(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error getting contractor leads:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Access a specific job request (deduct lead credit)
export const accessJobRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    const { jobRequestId } = req.params;

    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const result = await leadAccessService.accessJobRequest(contractorId, jobRequestId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: result.jobRequest,
    });
  } catch (error) {
    console.error("Error accessing job request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get contractor's lead usage statistics
export const getLeadUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const leadUsage = await leadAccessService.getLeadUsage(contractorId);

    res.json({
      success: true,
      data: leadUsage,
    });
  } catch (error) {
    console.error("Error getting lead usage:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Check if contractor can access a specific job request
export const checkJobAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    const { jobRequestId } = req.params;

    if (!contractorId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const result = await leadAccessService.canAccessJobRequest(contractorId, jobRequestId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking job access:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
