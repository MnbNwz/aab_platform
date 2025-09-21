import "dotenv/config";
import { Request, Response } from "express";
import Stripe from "stripe";
import { UserMembership } from "@models/user";
import { Payment } from "@models/payment";
import { User } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { getPlanById } from "@services/membership/membership";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Handle successful checkout session completion
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId, billingType, billingPeriod } = session.metadata || {};

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  try {
    // Get the plan details
    const plan = await getPlanById(planId);

    // Create payment record
    const payment = new Payment({
      userId: userId,
      email: session.customer_email || "",
      amount: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "succeeded",
      stripeCustomerId: session.customer as string,
      stripePaymentIntentId: session.payment_intent as string,
      stripeSubscriptionId: session.subscription as string,
      billingPeriod: billingPeriod as "monthly" | "yearly",
      billingType: billingType as "recurring" | "one_time",
    });

    await payment.save();

    // Create user membership
    const startDate = new Date();
    const endDate = new Date();

    if (billingPeriod === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const userMembership = new UserMembership({
      userId: userId,
      planId: planId,
      paymentId: payment._id,
      status: "active",
      billingPeriod: billingPeriod as "monthly" | "yearly",
      billingType: billingType as "recurring" | "one_time",
      startDate,
      endDate,
      isAutoRenew: billingType === "recurring",
    });

    await userMembership.save();

    console.log(`Membership created for user ${userId}, plan ${planId}`);
  } catch (error) {
    console.error("Error handling checkout session completion:", error);
  }
}

// Handle successful invoice payment (for recurring subscriptions)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;
    const userMembership = await UserMembership.findOne({ stripeSubscriptionId: subscriptionId });

    if (userMembership) {
      // Extend membership period
      const currentEndDate = userMembership.endDate;
      const newEndDate = new Date(currentEndDate);

      if (userMembership.billingPeriod === "monthly") {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      userMembership.endDate = newEndDate;
      userMembership.status = "active";
      await userMembership.save();

      console.log(`Membership renewed for user ${userMembership.userId}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription as string;
    const userMembership = await UserMembership.findOne({ stripeSubscriptionId: subscriptionId });

    if (userMembership) {
      userMembership.status = "expired";
      await userMembership.save();

      console.log(`Membership expired due to payment failure for user ${userMembership.userId}`);
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const userMembership = await UserMembership.findOne({ stripeSubscriptionId: subscription.id });

    if (userMembership) {
      if (subscription.status === "active") {
        userMembership.status = "active";
      } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
        userMembership.status = "expired";
      }

      await userMembership.save();
    }
  } catch (error) {
    console.error("Error handling subscription update:", error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userMembership = await UserMembership.findOne({ stripeSubscriptionId: subscription.id });

    if (userMembership) {
      userMembership.status = "canceled";
      await userMembership.save();

      console.log(`Membership canceled for user ${userMembership.userId}`);
    }
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
  }
}

// Handle successful payment intent (for one-time payments)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (payment) {
      payment.status = "succeeded";
      await payment.save();

      console.log(`Payment succeeded: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
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
    }
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
  }
}
