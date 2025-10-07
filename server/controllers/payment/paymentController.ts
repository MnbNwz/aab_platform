import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import * as paymentService from "@services/payment/payment";
import * as offMarketPaymentService from "@services/payment/offMarket";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";

// JOB PAYMENTS
export const createJobPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobRequestId, contractorId, bidId, totalAmount } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (!jobRequestId || !contractorId || !bidId || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Job request ID, contractor ID, bid ID, and total amount are required",
      });
    }

    const jobPayment = await paymentService.createJobPaymentRecord(
      jobRequestId,
      customerId,
      contractorId,
      bidId,
      totalAmount,
    );

    res.status(201).json({
      success: true,
      data: jobPayment,
    });
  } catch (error) {
    console.error("Error creating job payment:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processJobDeposit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobPaymentId } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (!jobPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Job payment ID is required",
      });
    }

    const result = await paymentService.processJobDepositPayment(jobPaymentId, customerId);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        jobPayment: result.jobPayment,
      },
    });
  } catch (error) {
    console.error("Error processing job deposit:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processJobPreStart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobPaymentId } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (!jobPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Job payment ID is required",
      });
    }

    const result = await paymentService.processJobPreStartPayment(jobPaymentId, customerId);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        jobPayment: result.jobPayment,
      },
    });
  } catch (error) {
    console.error("Error processing job pre-start:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processJobCompletion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobPaymentId } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (!jobPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Job payment ID is required",
      });
    }

    const result = await paymentService.processJobCompletionPayment(jobPaymentId, customerId);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        jobPayment: result.jobPayment,
      },
    });
  } catch (error) {
    console.error("Error processing job completion:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processJobRefund = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobPaymentId, paymentIntentId, amount, reason } = req.body;

    if (!jobPaymentId || !paymentIntentId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: "Job payment ID, payment intent ID, amount, and reason are required",
      });
    }

    const result = await paymentService.processJobRefundPayment(
      jobPaymentId,
      paymentIntentId,
      amount,
      reason,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing job refund:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// OFF-MARKET PAYMENTS
export const createOffMarketPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listingId, listingPrice, depositPercentage } = req.body;
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (!listingId || !listingPrice) {
      return res.status(400).json({
        success: false,
        message: "Listing ID and listing price are required",
      });
    }

    const result = await offMarketPaymentService.createOffMarketPayment(
      listingId,
      contractorId,
      listingPrice,
      depositPercentage || 0.1,
    );

    res.status(201).json({
      success: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        offMarketPayment: result.offMarketPayment,
      },
    });
  } catch (error) {
    console.error("Error creating off-market payment:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processOffMarketDeposit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offMarketPaymentId } = req.body;

    if (!offMarketPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Off-market payment ID is required",
      });
    }

    const offMarketPayment =
      await offMarketPaymentService.processOffMarketDeposit(offMarketPaymentId);

    res.status(200).json({
      success: true,
      data: offMarketPayment,
    });
  } catch (error) {
    console.error("Error processing off-market deposit:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const requestFinancing = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offMarketPaymentId, financingDetails } = req.body;

    if (!offMarketPaymentId || !financingDetails) {
      return res.status(400).json({
        success: false,
        message: "Off-market payment ID and financing details are required",
      });
    }

    const offMarketPayment = await offMarketPaymentService.requestFinancing(
      offMarketPaymentId,
      financingDetails,
    );

    res.status(200).json({
      success: true,
      data: offMarketPayment,
    });
  } catch (error) {
    console.error("Error requesting financing:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processFinancingPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offMarketPaymentId } = req.body;

    if (!offMarketPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Off-market payment ID is required",
      });
    }

    const result = await offMarketPaymentService.processFinancingPayment(offMarketPaymentId);

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.paymentIntent.client_secret,
        paymentIntentId: result.paymentIntent.id,
        offMarketPayment: result.offMarketPayment,
      },
    });
  } catch (error) {
    console.error("Error processing financing payment:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const processOffMarketRefund = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offMarketPaymentId, paymentIntentId, amount, reason } = req.body;

    if (!offMarketPaymentId || !paymentIntentId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: "Off-market payment ID, payment intent ID, amount, and reason are required",
      });
    }

    const result = await offMarketPaymentService.processOffMarketRefund(
      offMarketPaymentId,
      amount,
      reason,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing off-market refund:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// STRIPE CONNECT
export const setupContractorConnect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const result = await paymentService.setupContractorConnectAccount(contractorId);

    res.status(200).json({
      success: true,
      data: {
        accountLink: result.accountLink.url,
        accountId: result.account.id,
      },
    });
  } catch (error) {
    console.error("Error setting up contractor connect:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getContractorDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const result = await paymentService.getContractorDashboardLink(contractorId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting contractor dashboard:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getConnectStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.user?._id;

    if (!contractorId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const result = await paymentService.getConnectAccountStatus(contractorId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error getting connect status:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// PAYMENT MANAGEMENT
export const getPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const result = await paymentService.getPaymentHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: result.pagination.pages,
        totalItems: result.pagination.total,
        itemsPerPage: result.pagination.limit,
        hasNextPage: result.pagination.page < result.pagination.pages,
        hasPreviousPage: result.pagination.page > 1,
        nextPage:
          result.pagination.page < result.pagination.pages ? result.pagination.page + 1 : null,
        previousPage: result.pagination.page > 1 ? result.pagination.page - 1 : null,
      },
    });
  } catch (error) {
    console.error("Error getting payment history:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getPaymentDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await paymentService.getPaymentDetails(paymentId);

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error getting payment details:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getPaymentStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    const stats = await paymentService.getPaymentStatistics(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting payment stats:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// WEBHOOKS - handleStripeWebhook is exported from stripeWebhookController
