import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest } from "@middlewares/types";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";
import { UserMembership } from "@models/user";
import { getPlanById } from "@services/membership/membership";
import * as webhookService from "@services/payment/webhook";
import { stripe, webhookSecret } from "@config/stripe";

const endpointSecret = webhookSecret;

const processedEventIds = new Set<string>();
const DEDUPE_TTL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function isDuplicateAndMark(eventId: string): boolean {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    processedEventIds.clear();
    lastCleanup = now;
  }

  if (processedEventIds.has(eventId)) return true;
  processedEventIds.add(eventId);
  return false;
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, endpointSecret!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  if (event.id && isDuplicateAndMark(event.id)) {
    console.log(`🟡 Skipping duplicate webhook event ${event.id} (${event.type})`);
    return res.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleUpgradeCheckout(
  session: Stripe.Checkout.Session,
  userId: string,
  currentMembershipId: string,
  fromPlanId: string,
  toPlanId: string,
) {
  try {
    await webhookService.upgradeMembership(
      session,
      userId,
      currentMembershipId,
      fromPlanId,
      toPlanId,
    );
  } catch (error) {
    console.error("❌ Error processing upgrade checkout:", error);
    throw error;
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId, billingPeriod } = session.metadata || {};

  if (!userId || !planId) {
    return;
  }

  try {
    // AUTO-DETECT UPGRADE: Check if user has active membership
    const existingMembership = await UserMembership.findOne({
      userId,
      status: "active",
    }).populate("planId");

    if (existingMembership) {
      // Use upgrade logic with auto-detected values
      await handleUpgradeCheckout(
        session,
        userId,
        existingMembership._id.toString(),
        existingMembership.planId._id.toString(),
        planId,
      );
      return;
    }
    const plan = await getPlanById(planId);
    if (!plan) {
      return;
    }

    const result = await webhookService.createNewMembership(
      session,
      userId,
      planId,
      billingPeriod as "monthly" | "yearly",
    );
  } catch (error) {
    console.error("❌ Error handling checkout session completion:", error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    await webhookService.handlePaymentSuccess(paymentIntent);
  } catch (error) {
    console.error("❌ Error handling payment intent succeeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    await webhookService.handlePaymentFailure(paymentIntent);
  } catch (error) {
    console.error("❌ Error handling payment intent failed:", error);
  }
}

export const toggleAutoRenewal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isAutoRenew } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ success: false, message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
    }

    if (typeof isAutoRenew !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAutoRenew must be a boolean value",
      });
    }

    const membership = await UserMembership.findOne({
      userId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "No active membership found",
      });
    }

    membership.isAutoRenew = isAutoRenew;
    await membership.save();

    res.json({
      success: true,
      message: `Auto-renewal ${isAutoRenew ? "enabled" : "disabled"}`,
      data: {
        membershipId: membership._id,
        isAutoRenew: membership.isAutoRenew,
      },
    });
  } catch (error) {
    console.error("Error toggling auto-renewal:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
