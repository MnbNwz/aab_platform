import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { User } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { UserMembership } from "@models/user";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Rate limiting for payment endpoints
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many payment requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Enhanced rate limiting for checkout endpoints
export const checkoutRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 checkout requests per 5 minutes
  message: {
    success: false,
    message: "Too many checkout attempts, please try again later",
    code: "CHECKOUT_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Validate user has no active membership before creating new one
export const validateNoActiveMembership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const activeMembership = await UserMembership.findOne({
      userId: req.user._id,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (activeMembership) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active membership. Please cancel it before subscribing to a new one.",
        code: "ACTIVE_MEMBERSHIP_EXISTS",
        data: {
          currentMembership: {
            planId: activeMembership.planId,
            endDate: activeMembership.endDate,
            isAutoRenew: activeMembership.isAutoRenew,
          },
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error validating active membership:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

// Validate plan exists and is active
export const validatePlanExists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
        code: "MISSING_PLAN_ID",
      });
    }

    const plan = await MembershipPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive",
        code: "PLAN_NOT_FOUND",
      });
    }

    // Add plan to request for use in subsequent middleware
    (req as any).membershipPlan = plan;
    next();
  } catch (error) {
    console.error("Error validating plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

// Validate user role matches plan type
export const validateUserRoleForPlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const plan = (req as any).membershipPlan;
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan validation required",
        code: "PLAN_VALIDATION_REQUIRED",
      });
    }

    // Check if user role matches plan user type
    if (req.user.role !== plan.userType) {
      return res.status(403).json({
        success: false,
        message: `This plan is for ${plan.userType}s only. Your role is ${req.user.role}.`,
        code: "ROLE_MISMATCH",
        data: {
          userRole: req.user.role,
          planUserType: plan.userType,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Error validating user role for plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

// Validate payment amount matches plan pricing
export const validatePaymentAmount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { billingPeriod, billingType = "recurring" } = req.body;
    const plan = (req as any).membershipPlan;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan validation required",
        code: "PLAN_VALIDATION_REQUIRED",
      });
    }

    // Calculate expected amount
    let expectedAmount = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

    // Apply annual discount for yearly billing
    if (billingPeriod === "yearly") {
      expectedAmount = Math.round(expectedAmount * 0.85); // 15% discount
    }

    // Add amount validation to request
    (req as any).expectedAmount = expectedAmount;
    next();
  } catch (error) {
    console.error("Error validating payment amount:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

// Validate user account status
export const validateUserAccountStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    // Check if user account is active
    if (req.user.status === "revoked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been revoked. Please contact support.",
        code: "ACCOUNT_REVOKED",
      });
    }

    // Check if user email is verified (if required)
    // Note: emailVerified field may not exist in all user types
    if ((req.user as any).emailVerified === false) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before making payments.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    next();
  } catch (error) {
    console.error("Error validating user account status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

// Security headers for payment endpoints
export const paymentSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Log payment attempts for security monitoring
export const logPaymentAttempt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress || "Unknown";

  console.log(
    `🔒 Payment attempt - User: ${req.user?._id}, IP: ${ip}, UserAgent: ${userAgent}, Endpoint: ${req.path}`,
  );

  next();
};
