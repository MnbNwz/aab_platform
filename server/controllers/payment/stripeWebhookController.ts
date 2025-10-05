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
      // ===== MEMBERSHIP PURCHASE FLOW =====
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // ===== SUBSCRIPTION LIFECYCLE =====
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      // ===== PAYMENT INTENT EVENTS =====
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // ===== INVOICE EVENTS =====
      case "invoice.created":
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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
  const { userId, planId, billingPeriod } = session.metadata || {};

  if (!userId || !planId) {
    console.error("Missing metadata in checkout session:", session.metadata);
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
      stripeSessionId: session.id,
      stripeSubscriptionId: session.subscription as string,
      billingPeriod: billingPeriod as "monthly" | "yearly",
    });

    await payment.save();

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
      existingMembership.stripeSubscriptionId = session.subscription as string;
      await existingMembership.save();

      console.log(
        `✅ Extended existing membership for user ${userId}, plan ${planId}, from ${currentEndDate.toISOString()} to ${newEndDate.toISOString()}`,
      );
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

        console.log(
          `🔄 Upgraded membership for user ${userId}: ${differentPlanMembership.planId} → ${planId}, preserved ${remainingDays} days`,
        );
      } else {
        // No remaining days, start immediately
        membershipEndDate = getMembershipEndDate(
          membershipStartDate,
          billingPeriod as "monthly" | "yearly",
        );

        console.log(
          `🔄 Replaced expired membership for user ${userId}: ${differentPlanMembership.planId} → ${planId}`,
        );
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
      stripeSubscriptionId: session.subscription as string,
    });

    await userMembership.save();

    console.log(
      `✅ New membership created for user ${userId}, plan ${planId}, period: ${billingPeriod}, from ${membershipStartDate.toISOString()} to ${membershipEndDate.toISOString()}`,
    );
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

    // TODO: If enabling auto-renewal, create Stripe subscription
    // TODO: If disabling auto-renewal, cancel Stripe subscription

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

    // Find the payment record for this subscription
    const payment = await Payment.findOne({
      stripeSubscriptionId: subscriptionId,
      status: "succeeded", // Only update successful payments
    });

    if (payment) {
      // Update payment status to failed
      payment.status = "failed";
      payment.failureReason = (invoice as any).last_payment_error?.message || "Payment failed";
      await payment.save();

      console.log(`💳 Payment failed for subscription ${subscriptionId}: ${payment.failureReason}`);

      // Log membership that will be affected and send notification
      const userMembership = await UserMembership.findOne({ stripeSubscriptionId: subscriptionId });
      if (userMembership) {
        const daysUntilExpiration = getDaysRemaining(userMembership.endDate);

        console.log(
          `⚠️ Membership ${userMembership._id} will expire in ${daysUntilExpiration} days if payment not resolved`,
        );

        // Get user and membership plan details for notification
        const user = await User.findById(userMembership.userId);
        const membershipPlan = await MembershipPlan.findById(userMembership.planId);

        // Send payment failure notification email
        if (user && membershipPlan) {
          await sendPaymentFailedNotification(
            user.email,
            payment.amount,
            payment.failureReason || "Payment failed",
            membershipPlan.name,
            `${process.env.FRONTEND_URL}/update-payment?subscription=${subscriptionId}`,
          );
        }

        // Log payment failure details for monitoring
        console.log(`Payment Failure Details:`, {
          membershipId: userMembership._id,
          userId: userMembership.userId,
          planId: userMembership.planId,
          endDate: userMembership.endDate,
          daysUntilExpiration,
          failureReason: payment.failureReason,
        });
      }
    } else {
      console.log(`⚠️ No successful payment found for subscription ${subscriptionId}`);
    }
  } catch (error) {
    console.error("❌ Error handling invoice payment failed:", error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log(`🆕 Subscription created: ${subscription.id}`);

    // Update any existing membership with the subscription ID
    const customerId = subscription.customer as string;
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      await UserMembership.updateOne(
        { userId: user._id, status: "active" },
        {
          stripeSubscriptionId: subscription.id,
          isAutoRenew: true,
        },
      );
      console.log(
        `✅ Updated membership for user ${user._id} with subscription ${subscription.id}`,
      );
    }
  } catch (error) {
    console.error("❌ Error handling subscription creation:", error);
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

// Handle invoice creation
async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  try {
    console.log(`📄 Invoice created: ${invoice.id}`);

    // You can add logic here to notify users about upcoming charges
    // For example, send an email notification about the upcoming payment
  } catch (error) {
    console.error("❌ Error handling invoice creation:", error);
  }
}
