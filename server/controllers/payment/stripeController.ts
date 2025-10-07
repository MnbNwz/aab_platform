import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest } from "@middlewares/types";
import { getPlanById } from "@services/membership/membership";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";
import { ALLOWED_STRIPE_DOMAINS } from "@controllers/constants/validation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

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
