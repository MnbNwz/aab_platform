import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as leadAccessService from "@services/job/leads";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "../constants";

// Get contractor's lead usage and available job requests
export const getContractorLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
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
    console.error(CONTROLLER_ERROR_MESSAGES.LEAD_FETCH_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Access a specific job request (deduct lead credit)
export const accessJobRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    const { jobRequestId } = req.params;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
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
    console.error(CONTROLLER_ERROR_MESSAGES.LEAD_ACCESS_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Get contractor's lead usage statistics
export const getLeadUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const leadUsage = await leadAccessService.getLeadUsage(contractorId);

    res.json({
      success: true,
      data: leadUsage,
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.LEAD_USAGE_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};

// Check if contractor can access a specific job request
export const checkJobAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;
    const { jobRequestId } = req.params;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const result = await leadAccessService.canAccessJobRequest(contractorId, jobRequestId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(CONTROLLER_ERROR_MESSAGES.LEAD_CHECK_ERROR, error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
  }
};
