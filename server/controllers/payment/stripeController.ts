import "dotenv/config";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { getPlanById } from "@services/membership/membership";
import { validateUpgrade, getUpgradePaymentAmount } from "@services/membership/upgrade";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";
import { ALLOWED_STRIPE_DOMAINS } from "@controllers/constants/validation";
import { stripe } from "@config/stripe";
import { Bid } from "@models/job";

// Constants for optimization
const PAYMENT_TYPES = ["bid_acceptance", "job_completion"] as const;
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/;
const DEPOSIT_PERCENTAGE = 15;
const COMPLETION_PERCENTAGE = 85;

export const createStripeSession = async (req: Request, res: Response) => {
  try {
    const { planId, billingPeriod, url, isAutoRenew } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });

    if (!planId || typeof planId !== "string") {
      return res.status(400).json({ success: false, message: "Missing or invalid planId" });
    }
    if (!billingPeriod || (billingPeriod !== "monthly" && billingPeriod !== "yearly")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid billingPeriod (must be 'monthly' or 'yearly')" });
    }
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "Missing or invalid url" });
    }
    if (isAutoRenew !== undefined && typeof isAutoRenew !== "boolean") {
      return res.status(400).json({ success: false, message: "isAutoRenew must be a boolean" });
    }

    try {
      const parsedUrl = new URL(url);
      const allowedDomains = ALLOWED_STRIPE_DOMAINS;
      if (!(parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) {
        return res
          .status(400)
          .json({ success: false, message: "URL must start with http or https" });
      }
      if (!allowedDomains.some((domain) => parsedUrl.hostname.endsWith(domain))) {
        return res.status(400).json({ success: false, message: "URL domain not allowed" });
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid url format" });
    }

    const autoRenewEnabled = isAutoRenew === true;
    const checkoutMode: "payment" | "subscription" = autoRenewEnabled ? "subscription" : "payment";

    const plan = await getPlanById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    let stripePriceId: string | undefined;
    if (billingPeriod === "monthly") stripePriceId = plan.stripePriceIdMonthly;
    else if (billingPeriod === "yearly") stripePriceId = plan.stripePriceIdYearly;
    if (!stripePriceId)
      return res
        .status(400)
        .json({ success: false, message: "Stripe price ID not set for this plan" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: checkoutMode,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: authReq.user?.email,
      success_url: url,
      cancel_url: url,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        billingPeriod,
        isAutoRenew: autoRenewEnabled.toString(),
      },
      ...(autoRenewEnabled && {
        subscription_data: {
          metadata: {
            userId: userId.toString(),
            planId: planId.toString(),
            billingPeriod,
          },
        },
      }),
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ success: false, message: "Failed to create Stripe session" });
  }
};

// Create Stripe checkout session for job payments (bid acceptance or completion)
export const createJobPaymentCheckout = async (req: Request, res: Response) => {
  try {
    const { bidId, paymentType, successUrl, cancelUrl } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    // Validate required fields
    if (!bidId || !paymentType || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bidId, paymentType, successUrl, cancelUrl",
      });
    }

    // Validate payment type using constants
    if (!PAYMENT_TYPES.includes(paymentType as any)) {
      return res.status(400).json({
        success: false,
        message: `Invalid paymentType. Must be one of: ${PAYMENT_TYPES.join(", ")}`,
      });
    }

    // Validate URLs with optimized regex
    if (!URL_REGEX.test(successUrl) || !URL_REGEX.test(cancelUrl)) {
      return res.status(400).json({ success: false, message: "Invalid URL format" });
    }

    // Validate allowed domains
    const allowedDomains = ALLOWED_STRIPE_DOMAINS;
    const successDomain = new URL(successUrl).hostname;
    const cancelDomain = new URL(cancelUrl).hostname;

    if (
      !allowedDomains.some((domain) => successDomain.endsWith(domain)) ||
      !allowedDomains.some((domain) => cancelDomain.endsWith(domain))
    ) {
      return res.status(400).json({ success: false, message: "URL domain not allowed" });
    }

    // Single optimized database query with selective population
    const bid = await Bid.findById(bidId)
      .populate({
        path: "jobRequest",
        select: "title createdBy status depositPaid",
      })
      .lean();
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    const jobRequest = bid.jobRequest as any;

    // Verify the user is the job creator
    if (jobRequest.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only pay for your own jobs",
      });
    }

    // Optimized payment type validation
    if (paymentType === "bid_acceptance" && bid.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only pay deposit for pending bids",
      });
    }

    if (paymentType === "job_completion") {
      if (bid.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "Can only pay completion for accepted bids",
        });
      }
      if (!bid.depositPaid) {
        return res.status(400).json({
          success: false,
          message: "Deposit must be paid before completion payment",
        });
      }
    }

    // Optimized payment calculation using constants
    const amountCents =
      paymentType === "bid_acceptance"
        ? Math.round(bid.bidAmount * DEPOSIT_PERCENTAGE) // 15% in cents
        : Math.round(bid.bidAmount * COMPLETION_PERCENTAGE); // 85% in cents

    const amountDollars = amountCents / 100;
    const productName = `${paymentType === "bid_acceptance" ? "Job Deposit" : "Job Completion"} - ${jobRequest.title || "Contractor Job"}`;
    const description =
      paymentType === "bid_acceptance"
        ? "15% deposit for job acceptance"
        : "85% completion payment for job";

    // Create optimized Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName, description },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: authReq.user?.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        bidId,
        jobRequestId: jobRequest._id.toString(),
        contractorId: bid.contractor.toString(),
        paymentType,
        amount: amountDollars.toString(),
        totalJobAmount: bid.bidAmount.toString(),
        isJobPayment: "true",
      },
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      amount: amountDollars,
      paymentType,
    });
  } catch (error) {
    console.error("Error creating job payment checkout:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create checkout session";
    res.status(400).json({ success: false, message: errorMessage });
  }
};
