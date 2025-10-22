import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { UserMembership } from "@models/user";
import { getPlanById } from "@services/membership/membership";
import * as webhookService from "@services/payment/webhook";
import { stripe, webhookSecret } from "@config/stripe";

const endpointSecret = webhookSecret;

const processedEventIds = new Set<string>();
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

      // Subscription renewal events
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
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

    await webhookService.createNewMembership(
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

// ==================== SUBSCRIPTION RENEWAL HANDLERS ====================

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      console.log("⚠️ Invoice paid but no subscription ID found");
      return;
    }

    // Skip the first invoice (it's handled by checkout.session.completed)
    if (invoice.billing_reason === "subscription_create") {
      console.log("🔵 Skipping subscription_create invoice (handled by checkout)");
      return;
    }

    console.log(`🔄 Processing subscription renewal for: ${subscriptionId}`);

    // Find membership by subscription ID
    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    }).populate("planId");

    if (!membership) {
      console.error(`❌ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    // Calculate new end date based on billing period
    const daysToAdd = membership.billingPeriod === "monthly" ? 30 : 365;
    const newEndDate = new Date(membership.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Update membership
    membership.endDate = newEndDate;
    membership.status = "active";
    await membership.save();

    console.log(`✅ Membership renewed until: ${newEndDate.toISOString()}`);

    // Create payment record for the renewal
    const { Payment } = await import("@models/payment");
    const payment = new Payment({
      userId: membership.userId,
      email: invoice.customer_email || "",
      amount: invoice.amount_paid || 0,
      currency: invoice.currency || "usd",
      status: "succeeded",
      stripeCustomerId: invoice.customer as string,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: (invoice as any).payment_intent as string,
      billingPeriod: membership.billingPeriod,
    });
    await payment.save();

    console.log(`✅ Payment record created for renewal: ${payment._id}`);

    // Send renewal success email
    const { User } = await import("@models/user");
    const { sendPaymentReceipt } = await import("@utils/email");
    const user = await User.findById(membership.userId).select("firstName email").lean();

    if (user && invoice.customer_email) {
      const planDetails = membership.planId as any;
      await sendPaymentReceipt(
        invoice.customer_email,
        "membership",
        invoice.amount_paid || 0,
        payment._id.toString(),
        {
          firstName: user.firstName,
          planName: planDetails?.name || "Membership",
          billingPeriod: membership.billingPeriod,
          isRenewal: true,
        },
      );
      console.log(`✅ Renewal receipt sent to ${invoice.customer_email}`);
    }
  } catch (error) {
    console.error("❌ Error handling invoice paid:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      console.log("⚠️ Invoice payment failed but no subscription ID found");
      return;
    }

    console.log(`⚠️ Subscription payment failed for: ${subscriptionId}`);

    // Find membership by subscription ID
    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!membership) {
      console.error(`❌ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    // Mark membership as having payment issues (but don't expire immediately)
    // Stripe will retry automatically, so we just log for now
    console.log(
      `⚠️ Payment failed for membership: ${membership._id}. Stripe will retry automatically.`,
    );

    // Send payment failure email
    const { User } = await import("@models/user");
    const { sendPaymentFailedNotification } = await import("@utils/email");
    const { ENV_CONFIG } = await import("@config/env");

    const user = await User.findById(membership.userId).select("firstName email").lean();
    const planDetails = membership.planId as any;

    if (user) {
      await sendPaymentFailedNotification(
        user.email,
        invoice.amount_due || 0,
        "Subscription renewal payment failed. Stripe will retry automatically.",
        planDetails?.name || "Membership",
        `${ENV_CONFIG.FRONTEND_URL}/membership/update-payment`,
      );
      console.log(`✅ Payment failure notification sent to ${user.email}`);
    }

    // TODO: After X failed attempts, consider suspending the membership
  } catch (error) {
    console.error("❌ Error handling invoice payment failed:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;

    console.log(`🔴 Subscription deleted: ${subscriptionId}`);

    // Find membership by subscription ID
    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!membership) {
      console.error(`❌ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    // Turn off auto-renewal (subscription is cancelled)
    membership.isAutoRenew = false;
    membership.stripeSubscriptionId = undefined;
    await membership.save();

    console.log(`✅ Auto-renewal disabled for membership: ${membership._id}`);
    console.log(`ℹ️ Membership will expire on: ${membership.endDate.toISOString()}`);

    // Send cancellation notification email
    const { User } = await import("@models/user");
    const { sendSubscriptionCancelledNotification } = await import("@utils/email");
    const user = await User.findById(membership.userId).select("firstName email").lean();
    const planDetails = await getPlanById(membership.planId.toString());

    if (user && planDetails) {
      await sendSubscriptionCancelledNotification(
        user.email,
        user.firstName,
        membership.endDate,
        planDetails.name,
      );
    }
  } catch (error) {
    console.error("❌ Error handling subscription deleted:", error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;

    console.log(`🔄 Subscription updated: ${subscriptionId}`);

    // Find membership by subscription ID
    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!membership) {
      console.log(`⚠️ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    // Check if subscription was set to cancel at period end
    if (subscription.cancel_at_period_end) {
      const periodEnd = new Date(
        ((subscription as any).current_period_end || 0) * 1000,
      ).toISOString();
      console.log(`🔴 Subscription will cancel at period end: ${periodEnd}`);
      // We don't need to do anything - let it expire naturally
    }

    // Check if subscription was reactivated
    if (
      !subscription.cancel_at_period_end &&
      membership.isAutoRenew === false &&
      subscription.status === "active"
    ) {
      console.log(`🟢 Subscription reactivated`);
      membership.isAutoRenew = true;
      await membership.save();
    }
  } catch (error) {
    console.error("❌ Error handling subscription updated:", error);
  }
}
