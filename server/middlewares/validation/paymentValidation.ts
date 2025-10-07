import { Request, Response, NextFunction } from "express";
import { PAYMENT_VALIDATION, MIDDLEWARE_ERROR_MESSAGES, HTTP_STATUS } from "@middlewares/constants";

// Payment error types - moved here since they're only used in this file
export enum PaymentErrorType {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND",
  INVALID_PAYMENT_INTENT = "INVALID_PAYMENT_INTENT",
  STRIPE_ERROR = "STRIPE_ERROR",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_FAILED = "REFUND_FAILED",
  MEMBERSHIP_PLAN_NOT_FOUND = "MEMBERSHIP_PLAN_NOT_FOUND",
  JOB_PAYMENT_NOT_FOUND = "JOB_PAYMENT_NOT_FOUND",
  OFF_MARKET_PAYMENT_NOT_FOUND = "OFF_MARKET_PAYMENT_NOT_FOUND",
  CONTRACTOR_NOT_FOUND = "CONTRACTOR_NOT_FOUND",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
}

export class PaymentError extends Error {
  public readonly type: PaymentErrorType;
  public readonly statusCode: number;

  constructor(type: PaymentErrorType, message: string, statusCode: number = 400) {
    super(message);
    this.name = "PaymentError";
    this.type = type;
    this.statusCode = statusCode;
  }
}

export const validateMembershipCheckout = (req: Request, res: Response, next: NextFunction) => {
  const { planId, billingPeriod } = req.body;

  if (!planId || !billingPeriod) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: MIDDLEWARE_ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        code: "MISSING_REQUIRED_FIELDS",
      },
    });
  }

  if (!PAYMENT_VALIDATION.BILLING_PERIODS.includes(billingPeriod)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: MIDDLEWARE_ERROR_MESSAGES.INVALID_BILLING_PERIOD,
        code: "INVALID_BILLING_PERIOD",
      },
    });
  }

  next();
};

export const validateJobPayment = (req: Request, res: Response, next: NextFunction) => {
  const { jobRequestId, contractorId, bidId, totalAmount } = req.body;

  if (!jobRequestId || !contractorId || !bidId || !totalAmount) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Job request ID, contractor ID, bid ID, and total amount are required",
        code: "MISSING_REQUIRED_FIELDS",
      },
    });
  }

  if (totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Total amount must be greater than 0",
        code: "INVALID_AMOUNT",
      },
    });
  }

  next();
};

export const validateOffMarketPayment = (req: Request, res: Response, next: NextFunction) => {
  const { listingId, listingPrice, depositPercentage } = req.body;

  if (!listingId || !listingPrice) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Listing ID and listing price are required",
        code: "MISSING_REQUIRED_FIELDS",
      },
    });
  }

  if (listingPrice <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Listing price must be greater than 0",
        code: "INVALID_AMOUNT",
      },
    });
  }

  if (depositPercentage && (depositPercentage < 0 || depositPercentage > 1)) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Deposit percentage must be between 0 and 1",
        code: "INVALID_DEPOSIT_PERCENTAGE",
      },
    });
  }

  next();
};
