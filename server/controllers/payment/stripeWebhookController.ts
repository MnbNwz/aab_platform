import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { User, UserMembership } from "@models/user";
import { Bid, JobRequest } from "@models/job";
import { Payment } from "@models/payment";
import { getPlanById } from "@services/membership/membership";
import * as webhookService from "@services/payment/webhook";
import {
  sendPaymentReceipt,
  sendPaymentFailedNotification,
  sendSubscriptionCancelledNotification,
  sendBidAcceptedNotification,
} from "@utils/email";
import { stripe, webhookSecret } from "@config/stripe";
import { ENV_CONFIG } from "@config/env";

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
  const {
    userId,
    planId,
    billingPeriod,
    paymentType,
    bidId,
    jobRequestId,
    contractorId,
    isJobPayment,
  } = session.metadata || {};

  if (isJobPayment === "true") {
    if (!userId || !bidId || !jobRequestId || !contractorId || !paymentType) {
      console.error("❌ Missing required metadata for job payment");
      return;
    }

    try {
      await handleJobPayment(session, userId, bidId, jobRequestId, contractorId, paymentType);
    } catch (error) {
      console.error("❌ Error handling job payment:", error);
    }
    return;
  }

  if (!userId || !planId) {
    return;
  }

  try {
    const existingMembership = await UserMembership.findOne({
      userId,
      status: "active",
    }).populate("planId");

    if (existingMembership) {
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

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) {
      console.log("⚠️ Invoice paid but no subscription ID found");
      return;
    }

    if (invoice.billing_reason === "subscription_create") {
      console.log("🔵 Skipping subscription_create invoice (handled by checkout)");
      return;
    }

    console.log(`🔄 Processing subscription renewal for: ${subscriptionId}`);

    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    }).populate("planId");

    if (!membership) {
      console.error(`❌ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    const daysToAdd = membership.billingPeriod === "monthly" ? 30 : 365;
    const newEndDate = new Date(membership.endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    membership.endDate = newEndDate;
    membership.status = "active";
    await membership.save();

    console.log(`✅ Membership renewed until: ${newEndDate.toISOString()}`);

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

    const membership = await UserMembership.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!membership) {
      console.error(`❌ No membership found for subscription: ${subscriptionId}`);
      return;
    }

    console.log(
      `⚠️ Payment failed for membership: ${membership._id}. Stripe will retry automatically.`,
    );

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

async function handleJobPayment(
  session: Stripe.Checkout.Session,
  userId: string,
  bidId: string,
  jobRequestId: string,
  contractorId: string,
  paymentType: string,
) {
  try {
    console.log(`💰 Processing ${paymentType} payment for bid: ${bidId}`);

    const bid = await Bid.findById(bidId).lean();
    if (!bid) {
      console.error(`❌ Bid not found: ${bidId}`);
      return;
    }

    const amount = session.amount_total || parseFloat(session.metadata?.amount || "0");
    const totalJobAmount = parseFloat(session.metadata?.totalJobAmount || "0");

    let email = session.customer_email || null;
    let stripeCustomerId = (session.customer as string) || null;

    if (!email || !stripeCustomerId) {
      const user = await User.findById(userId).select("email stripeCustomerId").lean();
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return;
      }

      if (!email) {
        email = user.email;
      }

      if (!stripeCustomerId) {
        stripeCustomerId = user.stripeCustomerId || null;
      }
    }

    if (!stripeCustomerId && session.payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        stripeCustomerId = (pi.customer as string) || null;
      } catch (error) {
        console.error("Failed to retrieve payment intent:", error);
      }
    }

    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: email,
          metadata: { userId: userId.toString() },
        });
        stripeCustomerId = customer.id;
        await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });
      } catch (error) {
        console.error("Failed to create Stripe customer:", error);
        stripeCustomerId = `temp_${userId}`;
      }
    }

    if (paymentType === "bid_acceptance") {
      await processBidAcceptancePayment(
        userId,
        email,
        stripeCustomerId,
        session,
        bidId,
        jobRequestId,
        contractorId,
        amount,
        totalJobAmount,
        bid,
      );
    } else if (paymentType === "job_completion") {
      await processJobCompletionPayment(
        userId,
        email,
        stripeCustomerId,
        session,
        bidId,
        jobRequestId,
        contractorId,
        amount,
        totalJobAmount,
        bid,
      );
    }
  } catch (error) {
    console.error("❌ Error processing job payment:", error);
    throw error;
  }
}

async function processBidAcceptancePayment(
  userId: string,
  email: string,
  stripeCustomerId: string,
  session: Stripe.Checkout.Session,
  bidId: string,
  jobRequestId: string,
  contractorId: string,
  amount: number,
  totalJobAmount: number,
  bid: any,
) {
  if (bid.status !== "pending") {
    console.error(`❌ Bid is not pending: ${bidId}, status: ${bid.status}`);
    return;
  }

  const payment = new Payment({
    userId,
    email,
    amount,
    currency: session.currency || "usd",
    status: "succeeded",
    stripeCustomerId,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    billingPeriod: "monthly",
    metadata: {
      contractorId,
      jobRequestId,
      bidId,
      paymentType: "job_deposit",
      totalJobAmount,
      depositPercentage: 15,
      remainingAmount: totalJobAmount - amount,
      sessionMetadata: session.metadata,
    },
  });

  await payment.save();

  const [jobRequest, contractor, customer] = await Promise.all([
    JobRequest.findById(jobRequestId)
      .select("title createdBy")
      .populate("createdBy", "firstName lastName")
      .lean(),
    User.findById(contractorId).select("email firstName lastName").lean(),
    User.findById(userId).select("firstName lastName").lean(),
  ]);

  await Promise.all([
    Bid.findByIdAndUpdate(bidId, {
      $set: {
        status: "accepted",
        depositPaid: true,
        depositAmount: amount,
        depositPaymentId: payment._id,
        depositPaidAt: new Date(),
      },
    }),
    Bid.updateMany(
      {
        jobRequest: jobRequestId,
        _id: { $ne: bidId },
        status: "pending",
      },
      { $set: { status: "rejected" } },
    ),
    JobRequest.findByIdAndUpdate(jobRequestId, {
      $set: {
        status: "inprogress",
        acceptedBid: bidId,
        depositPaid: true,
        depositAmount: amount,
        paymentStatus: "deposit_paid",
      },
      $push: {
        timelineHistory: {
          status: "bid_accepted",
          date: new Date(),
          by: userId,
          description: `Bid accepted with 15% deposit of $${(amount / 100).toFixed(2)} paid`,
        },
      },
    }),
  ]);

  if (contractor?.email && customer && jobRequest) {
    const customerName =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";
    const jobTitle = jobRequest.title || "Job";
    const bidAmount = bid.bidAmount || 0;

    sendBidAcceptedNotification(contractor.email, customerName, jobTitle, bidAmount).catch(
      (error) => {
        console.error(`❌ Failed to send bid acceptance email to contractor:`, error);
      },
    );
  }

  console.log(`✅ Bid acceptance payment processed successfully for bid: ${bidId}`);
}

// Helper: Process job completion payment (85% remaining)
async function processJobCompletionPayment(
  userId: string,
  email: string,
  stripeCustomerId: string,
  session: Stripe.Checkout.Session,
  bidId: string,
  jobRequestId: string,
  contractorId: string,
  amount: number,
  totalJobAmount: number,
  bid: any,
) {
  if (bid.status !== "accepted") {
    console.error(`❌ Bid is not accepted: ${bidId}, status: ${bid.status}`);
    return;
  }

  if (!bid.depositPaid) {
    console.error(`❌ Deposit not paid for bid: ${bidId}`);
    return;
  }

  const payment = new Payment({
    userId,
    email,
    amount,
    currency: session.currency || "usd",
    status: "succeeded",
    stripeCustomerId,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    billingPeriod: "monthly",
    metadata: {
      contractorId,
      jobRequestId,
      bidId,
      paymentType: "job_completion",
      totalJobAmount,
      completionPercentage: 85,
      totalPaid: (bid.depositAmount || 0) + amount,
      sessionMetadata: session.metadata,
    },
  });

  await payment.save();

  await Promise.all([
    Bid.findByIdAndUpdate(bidId, {
      $set: {
        completionPaid: true,
        completionAmount: amount,
        completionPaymentId: payment._id,
        completionPaidAt: new Date(),
      },
    }),
    JobRequest.findByIdAndUpdate(jobRequestId, {
      $set: {
        status: "completed",
        paymentStatus: "completed",
        completionPaid: true,
        completionAmount: amount,
        completionPaymentId: payment._id,
        completionPaidAt: new Date(),
      },
      $push: {
        timelineHistory: {
          status: "job_completed",
          date: new Date(),
          by: userId,
          description: `Job completed with final payment of $${(amount / 100).toFixed(2)}`,
        },
      },
    }),
  ]);

  console.log(`✅ Job completion payment processed successfully for bid: ${bidId}`);
}
