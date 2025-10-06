import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { AuthenticatedRequest } from "@middlewares/types";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "../constants";
import { UserMembership } from "@models/user";
import { Payment } from "@models/payment";
import { User } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { getPlanById } from "@services/membership/membership";
import { getDaysRemaining, getMembershipEndDate } from "@utils/core/date";
import { sendPaymentFailedNotification } from "@utils/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// In-memory deduplication of webhook events to avoid double-processing
// Stripe may retry deliveries; we remember processed event ids briefly
const processedEventIds = new Set<string>();
const DEDUPE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Clean up old entries periodically (not on every request)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicateAndMark(eventId: string): boolean {
  const now = Date.now();

  // Periodic cleanup (not on every request)
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    processedEventIds.clear(); // Simple: clear all, let them expire naturally
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
    // req.body is a Buffer because of express.raw() on this route
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Deduplicate retries/replays
  if (event.id && isDuplicateAndMark(event.id)) {
    console.log(`🟡 Skipping duplicate webhook event ${event.id} (${event.type})`);
    return res.json({ received: true, duplicate: true });
  }

  console.log(`🔔 Webhook received: ${event.type} (id=${event.id})`);

  try {
    switch (event.type) {
      // ===== ONE-TIME PAYMENT FLOW =====
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

// Handle successful checkout session completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("🧾 checkout.session.completed payload:", {
    id: session.id,
    customer: session.customer,
    payment_intent: session.payment_intent,
    amount_total: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
  });

  const { userId, planId, billingPeriod } = session.metadata || {};

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.metadata);
    return;
  }

  try {
    // Get the plan details
    const plan = await getPlanById(planId);

    // Resolve a customer id for the session
    let stripeCustomerId: string | null = (session.customer as string) || null;
    if (!stripeCustomerId && session.payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        stripeCustomerId = (pi.customer as string) || null;
        console.log("🔎 Resolved customer from PaymentIntent:", stripeCustomerId);
      } catch (_) {
        // ignore; will fallback to creating a customer if needed
      }
    }
    if (!stripeCustomerId) {
      // As a last resort, create a customer so Payment schema requirement is satisfied
      const created = await stripe.customers.create({
        email: session.customer_email || undefined,
        metadata: { source: "checkout.session.completed" },
      });
      stripeCustomerId = created.id;
      console.log("🆕 Created fallback Stripe customer:", stripeCustomerId);
    }

    // Ensure user's Stripe customer id is synced to the User document
    if (stripeCustomerId && typeof userId === "string") {
      const user = await User.findById(userId);
      if (user && !user.stripeCustomerId) {
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }
    }
    // Create payment record
    const payment = new Payment({
      userId: userId,
      email: session.customer_email || "",
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "succeeded",
      stripeCustomerId: stripeCustomerId as string,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      billingPeriod: billingPeriod as "monthly" | "yearly",
    });

    await payment.save();
    console.log("💾 Payment saved:", {
      paymentId: payment._id.toString(),
      userId,
      planId,
      amount: payment.amount,
      stripeCustomerId,
    });

    // Check if user has active membership with same plan
    const existingMembership = await UserMembership.findOne({
      userId: userId,
      planId: planId,
      status: "active",
    });

    if (existingMembership) {
      // EXTEND existing membership for same plan - preserve all remaining days
      const currentEndDate = existingMembership.endDate;
      const newEndDate = getMembershipEndDate(
        currentEndDate,
        billingPeriod as "monthly" | "yearly",
      );

      // Update existing membership
      existingMembership.endDate = newEndDate;
      existingMembership.isAutoRenew = false; // Default to false, user can toggle later
      await existingMembership.save();

      console.log("✅ Membership extended:", {
        userId,
        planId,
        from: currentEndDate.toISOString(),
        to: newEndDate.toISOString(),
      });
      return;
    }

    // Check if user has active membership with different plan
    const differentPlanMembership = await UserMembership.findOne({
      userId: userId,
      status: "active",
    });

    let membershipStartDate = new Date();
    let membershipEndDate: Date;

    if (differentPlanMembership) {
      // PRESERVE remaining days from different plan membership
      const remainingDays = getDaysRemaining(differentPlanMembership.endDate);

      if (remainingDays > 0) {
        // Use the existing membership's end date as the start date for new membership
        membershipStartDate = differentPlanMembership.endDate;
        membershipEndDate = getMembershipEndDate(
          membershipStartDate,
          billingPeriod as "monthly" | "yearly",
        );

        console.log("🔄 Upgraded membership (preserved days):", {
          userId,
          fromPlan: differentPlanMembership.planId,
          toPlan: planId,
          preservedDays: remainingDays,
        });
      } else {
        // No remaining days, start immediately
        membershipEndDate = getMembershipEndDate(
          membershipStartDate,
          billingPeriod as "monthly" | "yearly",
        );

        console.log("🔄 Replaced expired membership:", {
          userId,
          fromPlan: differentPlanMembership.planId,
          toPlan: planId,
        });
      }

      // Expire old membership
      differentPlanMembership.status = "expired";
      await differentPlanMembership.save();
    } else {
      // No existing membership, start immediately
      membershipEndDate = getMembershipEndDate(
        membershipStartDate,
        billingPeriod as "monthly" | "yearly",
      );
    }

    // Create new user membership
    const userMembership = new UserMembership({
      userId: userId,
      planId: planId,
      paymentId: payment._id,
      status: "active",
      billingPeriod: billingPeriod as "monthly" | "yearly",
      startDate: membershipStartDate,
      endDate: membershipEndDate,
      isAutoRenew: false,
    });

    await userMembership.save();

    console.log("✅ New membership created:", {
      userId,
      planId,
      billingPeriod,
      start: membershipStartDate.toISOString(),
      end: membershipEndDate.toISOString(),
      paymentId: payment._id.toString(),
    });
  } catch (error) {
    console.error("❌ Error handling checkout session completion:", error);
  }
}

// Auto-renewal toggle endpoint
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

    // Find active membership
    const membership = await UserMembership.findOne({
      userId: userId,
      status: "active",
      endDate: { $gt: new Date() },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "No active membership found",
      });
    }

    // Update auto-renewal setting
    membership.isAutoRenew = isAutoRenew;
    await membership.save();

    // Note: Auto-renewal is just a database flag for now
    // Future implementation could create Stripe subscriptions when enabled

    res.status(200).json({
      success: true,
      message: `Auto-renewal ${isAutoRenew ? "enabled" : "disabled"} successfully`,
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

// Handle successful payment intent (for one-time payments)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (payment) {
      payment.status = "succeeded";
      await payment.save();

      // If this is a one-time membership payment, ensure the membership is active
      if (payment.planId) {
        // Always one-time initially
        const userMembership = await UserMembership.findOne({
          userId: payment.userId,
          paymentId: payment._id,
        });

        if (userMembership && userMembership.status !== "active") {
          userMembership.status = "active";
          await userMembership.save();
          console.log(`✅ Activated one-time membership for user ${payment.userId}`);
        }
      }

      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error("❌ Error handling payment intent succeeded:", error);
  }
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (payment) {
      payment.status = "failed";
      payment.failureReason = paymentIntent.last_payment_error?.message || "Unknown error";
      await payment.save();

      console.log(`Payment failed: ${paymentIntent.id}`);

      // Send payment failure notification email
      const user = await User.findById(payment.userId);
      if (user) {
        await sendPaymentFailedNotification(
          user.email,
          payment.amount,
          payment.failureReason,
          undefined, // No specific plan for one-time payments
          `${process.env.FRONTEND_URL}/retry-payment/${payment._id}`,
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
}
