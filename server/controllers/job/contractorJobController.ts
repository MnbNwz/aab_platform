import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { getJobsForContractor, getContractorMyJobs } from "@services/job/contractorJobService";
import { getJobRequestById } from "@services/job/job";
import { LeadAccess } from "@models/job/leadAccess";
import { Bid } from "@models/job";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants/validation";

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

    if (authReq.user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "This endpoint is only available for contractors",
      });
    }

    const job = await getJobRequestById(jobId);
    if (!job) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Job not found",
      });
    }

    const leadAccess = await LeadAccess.findOne({
      contractor: userId,
      jobRequest: jobId,
    }).populate("bid");

    let self = !!leadAccess;
    let myBid = leadAccess?.bid ? (leadAccess.bid as any) : null;
    let selfBidAccepted = myBid?.status === "accepted";

    if (!myBid && job.acceptedBid) {
      const acceptedBidDoc = await Bid.findById(job.acceptedBid).lean();
      if (acceptedBidDoc && acceptedBidDoc.contractor?.toString() === userId?.toString()) {
        myBid = acceptedBidDoc;
        selfBidAccepted = myBid.status === "accepted";
        self = true;
      }
    }

    const responseData: any = {
      ...job,
      self,
      myBid,
      selfBidAccepted,
    };

    const bidInfo = req.query.bidInfo === "true";

    if (bidInfo && selfBidAccepted && myBid) {
      const acceptedBid = await Bid.findById(myBid._id || myBid)
        .populate("contractor", "firstName lastName email phone")
        .lean();

      if (acceptedBid) {
        responseData.bidInfo = {
          _id: acceptedBid._id,
          bidAmount: acceptedBid.bidAmount,
          message: acceptedBid.message,
          status: acceptedBid.status,
          timeline: acceptedBid.timeline,
          materials: acceptedBid.materials,
          warranty: acceptedBid.warranty,
          depositPaid: acceptedBid.depositPaid,
          depositAmount: acceptedBid.depositAmount,
          depositPaidAt: acceptedBid.depositPaidAt,
          completionPaid: acceptedBid.completionPaid,
          completionAmount: acceptedBid.completionAmount,
          completionPaidAt: acceptedBid.completionPaidAt,
          createdAt: acceptedBid.createdAt,
          updatedAt: acceptedBid.updatedAt,
          contractor: acceptedBid.contractor,
        };
      }
    }

    if (!selfBidAccepted && responseData.createdBy) {
      responseData.createdBy = {
        _id: responseData.createdBy._id,
      };
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error getting contractor job by ID:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
};

export const getContractorSelfJobs = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    if (authReq.user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "This endpoint is only available for contractors",
      });
    }

    const filters = req.query;
    const result = await getContractorMyJobs(userId, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting contractor my jobs:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch contractor my jobs",
    });
  }
};
