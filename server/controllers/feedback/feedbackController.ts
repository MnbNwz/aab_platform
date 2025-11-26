import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { HTTP_STATUS, CONTROLLER_ERROR_MESSAGES } from "@controllers/constants";
import {
  createFeedbackForJob,
  getFeedbackForUser,
  getPendingFeedbackJobsForCurrentUser,
} from "@services/feedback/feedbackService";

function parseRating(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric < 1 || numeric > 5) {
    return null;
  }

  return numeric;
}

export const createFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    const { jobRequestId, rating, comment } = req.body as {
      jobRequestId?: string;
      rating?: unknown;
      comment?: string;
    };

    if (!jobRequestId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "jobRequestId is required",
      });
    }

    const parsedRating = parseRating(rating);

    if (parsedRating === null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "rating must be a number between 1 and 5",
      });
    }

    if (user.role !== "customer" && user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.FORBIDDEN,
      });
    }

    const fromRole = user.role;

    const feedback = await createFeedbackForJob({
      jobRequestId,
      fromUserId: user._id,
      fromRole,
      rating: parsedRating,
      comment,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create feedback";

    if (
      message === "JOB_NOT_FOUND" ||
      message === CONTROLLER_ERROR_MESSAGES.JOB_REQUEST_NOT_FOUND
    ) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.JOB_REQUEST_NOT_FOUND,
      });
    }

    if (message === "JOB_NOT_COMPLETED" || message === "JOB_HAS_NO_ACCEPTED_BID") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message,
      });
    }

    if (
      message === "ONLY_JOB_CUSTOMER_CAN_REVIEW" ||
      message === "ONLY_ACCEPTED_CONTRACTOR_CAN_REVIEW"
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message,
      });
    }

    if (message === "FEEDBACK_ALREADY_EXISTS") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Feedback already exists for this job and user pair",
      });
    }

    // Default internal error
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: message,
    });
  }
};

export const getUserFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    const { userId } = req.params;

    const feedbacks = await getFeedbackForUser(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch feedback";

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: message,
    });
  }
};

export const getPendingFeedbackJobs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    if (user.role !== "customer" && user.role !== "contractor") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.FORBIDDEN,
      });
    }

    const jobs = await getPendingFeedbackJobsForCurrentUser(user._id, user.role);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch pending jobs";

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      details: message,
    });
  }
};
