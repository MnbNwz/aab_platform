import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest } from "@middlewares/types";
import { getPlanById, getCurrentMembership } from "@services/membership/membership";
import { validateUpgrade, getUpgradePaymentAmount } from "@services/membership/upgrade";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";
import { ALLOWED_STRIPE_DOMAINS } from "@controllers/constants/validation";
import { stripe } from "@config/stripe";

export const createStripeSession = async (req: Request, res: Response) => {
  try {
    const { planId, billingPeriod, url } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;
    if (!userId)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });

    // Validate required fields
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
    // Validate url is absolute, starts with http/https, and matches allowed domains
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
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid url format" });
    }

    // Fetch plan from DB (never trust frontend for price/stripe ids)
    const plan = await getPlanById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // Determine Stripe price ID
    let stripePriceId: string | undefined;
    if (billingPeriod === "monthly") stripePriceId = plan.stripePriceIdMonthly;
    else if (billingPeriod === "yearly") stripePriceId = plan.stripePriceIdYearly;
    else return res.status(400).json({ success: false, message: "Invalid billing period" });
    if (!stripePriceId)
      return res
        .status(400)
        .json({ success: false, message: "Stripe price ID not set for this plan" });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: authReq.user?.email,
      success_url: url,
      cancel_url: url,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
        billingPeriod,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ success: false, message: "Failed to create Stripe session" });
  }
};

export const createUpgradeStripeSession = async (req: Request, res: Response) => {
  try {
    const { newPlanId, url, newBillingPeriod } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?._id;

    if (!userId)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });

    // Validate required fields
    if (!newPlanId || typeof newPlanId !== "string") {
      return res.status(400).json({ success: false, message: "Missing or invalid newPlanId" });
    }
    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, message: "Missing or invalid url" });
    }

    // Validate new billing period (optional - defaults to current if not provided)
    if (newBillingPeriod && newBillingPeriod !== "monthly" && newBillingPeriod !== "yearly") {
      return res.status(400).json({
        success: false,
        message: "Invalid newBillingPeriod (must be 'monthly' or 'yearly')",
      });
    }

    // Validate url
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
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid url format" });
    }

    // Validate upgrade eligibility
    const { currentMembership, currentPlan, newPlan } = await validateUpgrade(
      userId.toString(),
      newPlanId,
    );

    // Determine the billing period to use (allow changing billing period during upgrade)
    const targetBillingPeriod =
      (newBillingPeriod as "monthly" | "yearly") || currentMembership.billingPeriod;

    // Calculate upgrade payment amount (full price of new plan with new billing period)
    const paymentAmount = getUpgradePaymentAmount(newPlan, targetBillingPeriod);

    // Determine Stripe price ID based on target billing period
    let stripePriceId: string | undefined;
    if (targetBillingPeriod === "monthly") stripePriceId = newPlan.stripePriceIdMonthly;
    else if (targetBillingPeriod === "yearly") stripePriceId = newPlan.stripePriceIdYearly;

    if (!stripePriceId)
      return res
        .status(400)
        .json({ success: false, message: "Stripe price ID not set for this plan" });

    // Create Stripe Checkout Session with upgrade metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: authReq.user?.email,
      success_url: url,
      cancel_url: url,
      metadata: {
        userId: userId.toString(),
        planId: newPlanId.toString(),
        billingPeriod: targetBillingPeriod, // Use new billing period
        isUpgrade: "true", // Flag to identify this as an upgrade
        currentMembershipId: currentMembership._id.toString(),
        fromPlanId: currentPlan._id.toString(),
        toPlanId: newPlan._id.toString(),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Error creating upgrade Stripe session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create upgrade Stripe session";
    res.status(400).json({ success: false, message: errorMessage });
  }
};
