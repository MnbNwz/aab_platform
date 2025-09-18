import { Request, Response, NextFunction } from "express";
import { PaymentError, PaymentErrorType } from "@schemas/payment";

export const validateMembershipCheckout = (req: Request, res: Response, next: NextFunction) => {
  const { planId, billingPeriod } = req.body;

  if (!planId || !billingPeriod) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Plan ID and billing period are required",
        code: "MISSING_REQUIRED_FIELDS",
      },
    });
  }

  if (!["monthly", "yearly"].includes(billingPeriod)) {
    return res.status(400).json({
      success: false,
      error: {
        type: PaymentErrorType.INVALID_AMOUNT,
        message: "Billing period must be 'monthly' or 'yearly'",
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
