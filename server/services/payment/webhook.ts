import Stripe from "stripe";
import { Types } from "mongoose";
import { User } from "@models/user";
import { UserMembership } from "@models/user";
import { Payment } from "@models/payment";
import { MembershipPlan } from "@models/membership";
import { sendPaymentReceipt, sendPaymentFailedNotification } from "@utils/email";
import { getMembershipEndDate, getDaysRemaining } from "@utils/core/date";
import { stripe } from "@config/stripe";
import { ENV_CONFIG } from "@config/env";
import { validateUpgrade, calculateEffectiveBenefits } from "@services/membership/upgrade";

// ==================== MEMBERSHIP UPGRADE ====================
// UPDATED: Now handles ALL upgrades including same-tier with different duration
// All effective benefits are calculated and stored as snapshots
export const upgradeMembership = async (
  session: Stripe.Checkout.Session,
  userId: string,
  currentMembershipId: string,
  fromPlanId: string,
  toPlanId: string,
) => {
  // Fetch current membership and both plans
  // NOTE: Don't filter by status="active" since we're in a transaction
  // and the status might be changed during the same transaction
  const currentMembership = await UserMembership.findOne({
    _id: new Types.ObjectId(currentMembershipId),
  }).populate("planId");

  if (!currentMembership) {
    throw new Error("Active membership not found for upgrade");
  }

  const currentPlan = await MembershipPlan.findById(fromPlanId);
  const newPlan = await MembershipPlan.findById(toPlanId);

  if (!currentPlan || !newPlan) {
    throw new Error("Plan not found");
  }

  // Validate same user type
  if (currentPlan.userType !== newPlan.userType) {
    throw new Error("Cannot change user type during upgrade");
  }

  // Get the new billing period from session metadata (allows changing billing period)
  const newBillingPeriod =
    (session.metadata?.billingPeriod as "monthly" | "yearly") || currentMembership.billingPeriod;

  // Calculate all effective benefits using the NEW billing period
  const effectiveBenefits = calculateEffectiveBenefits(
    currentMembership.toObject(),
    currentPlan.toObject(),
    newPlan.toObject(),
    newBillingPeriod, // Use new billing period for calculations
  );

  // Get or create stripe customer
  const user = await User.findById(userId);
  let stripeCustomerId = user?.stripeCustomerId || (session.customer as string) || null;

  if (!stripeCustomerId && session.payment_intent) {
    try {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      stripeCustomerId = (pi.customer as string) || null;
    } catch (error) {
      console.log("Failed to retrieve payment intent:", error);
    }
  }

  if (!stripeCustomerId) {
    const created = await stripe.customers.create({
      email: session.customer_email || undefined,
      metadata: { source: "upgrade_checkout" },
    });
    stripeCustomerId = created.id;
  }

  // Transaction to create payment, new membership, and expire old
  const mongoSession = await UserMembership.startSession();
  let paymentId: any;
  let newMembershipId: any;

  await mongoSession.withTransaction(async () => {
    // Create payment record
    const payment = await Payment.create(
      [
        {
          userId,
          email: session.customer_email || user?.email || "",
          amount: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "succeeded",
          stripeCustomerId: stripeCustomerId as string,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          billingPeriod: newBillingPeriod, // Use new billing period
        },
      ],
      { session: mongoSession },
    );
    paymentId = payment[0]._id;

    // Create new membership with ALL effective benefits
    // IMPORTANT: Preserve original startDate to maintain full membership history
    const originalStartDate = currentMembership.startDate;

    // Preserve auto-renewal and subscription info during upgrade
    const isAutoRenew = currentMembership.isAutoRenew || false;
    const stripeSubscriptionId = currentMembership.stripeSubscriptionId || undefined;

    const newMembership = await UserMembership.create(
      [
        {
          userId,
          planId: toPlanId,
          paymentId: payment[0]._id,
          status: "active",
          billingPeriod: newBillingPeriod, // Use new billing period
          startDate: originalStartDate, // Preserve original start date
          endDate: effectiveBenefits.newEndDate,
          isAutoRenew: isAutoRenew, // Preserve auto-renewal preference
          stripeSubscriptionId: stripeSubscriptionId, // Preserve subscription ID
          isUpgraded: true,
          upgradedFromMembershipId: currentMembershipId,

          // Lead tracking
          leadsUsedThisMonth: 0,
          leadsUsedThisYear: 0,
          lastLeadResetDate: new Date(),
          accumulatedLeads: effectiveBenefits.accumulatedLeads,
          bonusLeadsFromUpgrade: effectiveBenefits.bonusLeads,

          // Effective contractor benefits
          effectiveLeadsPerMonth: effectiveBenefits.effectiveLeadsPerMonth,
          effectiveAccessDelayHours: effectiveBenefits.effectiveAccessDelayHours,
          effectiveRadiusKm: effectiveBenefits.effectiveRadiusKm,
          effectiveFeaturedListing: effectiveBenefits.featuredListing,
          effectiveOffMarketAccess: effectiveBenefits.offMarketAccess,
          effectivePublicityReferences: effectiveBenefits.publicityReferences,
          effectiveVerifiedBadge: effectiveBenefits.verifiedBadge,
          effectiveFinancingSupport: effectiveBenefits.financingSupport,
          effectivePrivateNetwork: effectiveBenefits.privateNetwork,

          // Effective customer benefits
          effectiveMaxProperties: effectiveBenefits.effectiveMaxProperties,
          effectivePropertyType: effectiveBenefits.effectivePropertyType,
          effectivePlatformFeePercentage: effectiveBenefits.effectivePlatformFeePercentage,
          effectiveFreeCalculators: effectiveBenefits.freeCalculators,
          effectiveUnlimitedRequests: effectiveBenefits.unlimitedRequests,
          effectiveContractorReviewsVisible: effectiveBenefits.contractorReviewsVisible,
          effectivePriorityContractorAccess: effectiveBenefits.priorityContractorAccess,
          effectivePropertyValuationSupport: effectiveBenefits.propertyValuationSupport,
          effectiveCertifiedAASWork: effectiveBenefits.certifiedAASWork,
          effectiveFreeEvaluation: effectiveBenefits.freeEvaluation,

          // Upgrade history - PRESERVE existing history and add new entry
          upgradeHistory: [
            // CRITICAL FIX: Preserve ALL previous upgrade history
            ...(currentMembership.upgradeHistory || []),
            // Add new upgrade entry
            {
              fromPlanId,
              toPlanId,
              upgradedAt: new Date(),
              daysAdded: effectiveBenefits.newPlanDuration,
              leadsAdded: effectiveBenefits.bonusLeads, // FIXED: Use actual bonus leads, not base plan
              amountPaid: session.amount_total || 0,
              paymentId: payment[0]._id,
            },
          ],
        },
      ],
      { session: mongoSession },
    );
    newMembershipId = newMembership[0]._id;

    // Expire old membership
    await UserMembership.updateOne(
      { _id: currentMembershipId, status: "active" },
      {
        $set: {
          status: "upgraded",
          upgradedToMembershipId: newMembership[0]._id,
        },
      },
      { session: mongoSession },
    );

    // Update user's stripe customer ID if needed
    if (stripeCustomerId && !user?.stripeCustomerId) {
      await User.updateOne(
        { _id: userId },
        { $set: { stripeCustomerId } },
        { session: mongoSession },
      );
    }
  });

  await mongoSession.endSession();

  // Send receipt email with upgrade details
  const userForEmail = await User.findById(userId).select("firstName email").lean();
  if (userForEmail && session.customer_email) {
    await sendPaymentReceipt(
      session.customer_email,
      "membership",
      session.amount_total || 0,
      paymentId.toString(),
      {
        firstName: userForEmail.firstName,
        planName: newPlan.name,
        billingPeriod: currentMembership.billingPeriod,
        isUpgrade: true,
        fromPlan: currentPlan.name,
        // Include accumulated benefit details
        accumulatedDays: effectiveBenefits.accumulatedDays,
        accumulatedLeads: effectiveBenefits.accumulatedLeads,
        effectivePlatformFee: effectiveBenefits.effectivePlatformFeePercentage,
        effectivePropertyType: effectiveBenefits.effectivePropertyType,
        effectiveAccessDelayHours: effectiveBenefits.effectiveAccessDelayHours,
        effectiveRadiusKm: effectiveBenefits.effectiveRadiusKm,
      },
    );
  }

  return {
    message: "Membership upgraded successfully",
    upgrade: {
      fromPlan: currentPlan.name,
      toPlan: newPlan.name,
      accumulatedDays: effectiveBenefits.accumulatedDays,
      accumulatedLeads: effectiveBenefits.accumulatedLeads,
      newEndDate: effectiveBenefits.newEndDate,
      effectiveBenefits: {
        accessDelayHours: effectiveBenefits.effectiveAccessDelayHours,
        radiusKm: effectiveBenefits.effectiveRadiusKm,
        platformFee: effectiveBenefits.effectivePlatformFeePercentage,
        propertyType: effectiveBenefits.effectivePropertyType,
      },
    },
  };
};

// ==================== MEMBERSHIP EXTENSION REMOVED ====================
// Extension functionality has been merged into upgrade logic
// Any purchase while having an active membership is now treated as an upgrade

// ==================== NEW MEMBERSHIP CREATION ====================
export const createNewMembership = async (
  session: Stripe.Checkout.Session,
  userId: string,
  planId: string,
  billingPeriod: "monthly" | "yearly",
) => {
  const result = await MembershipPlan.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(planId),
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userId: new Types.ObjectId(userId) },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { firstName: 1, email: 1, stripeCustomerId: 1 } },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "usermemberships",
        let: { userId: new Types.ObjectId(userId) },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$userId", "$$userId"] }, { $eq: ["$status", "active"] }],
              },
            },
          },
        ],
        as: "existingMembership",
      },
    },
    {
      $unwind: {
        path: "$existingMembership",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  if (!result.length) {
    throw new Error("Plan not found");
  }

  const data = result[0];

  let stripeCustomerId = data.user.stripeCustomerId || (session.customer as string) || null;
  if (!stripeCustomerId && session.payment_intent) {
    try {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
      stripeCustomerId = (pi.customer as string) || null;
    } catch (error) {
      console.log("Failed to retrieve payment intent:", error);
    }
  }
  if (!stripeCustomerId) {
    const created = await stripe.customers.create({
      email: session.customer_email || data.user.email,
      metadata: { source: "new_membership" },
    });
    stripeCustomerId = created.id;
  }

  if (stripeCustomerId && !data.user.stripeCustomerId) {
    await User.updateOne({ _id: userId }, { $set: { stripeCustomerId } });
  }

  let membershipStartDate = new Date();
  let membershipEndDate: Date;

  if (data.existingMembership) {
    const remainingDays = getDaysRemaining(data.existingMembership.endDate);

    if (remainingDays > 0) {
      membershipStartDate = data.existingMembership.endDate;
      membershipEndDate = getMembershipEndDate(membershipStartDate, billingPeriod);
    } else {
      membershipEndDate = getMembershipEndDate(membershipStartDate, billingPeriod);
    }

    await UserMembership.updateOne(
      { _id: data.existingMembership._id },
      { $set: { status: "expired" } },
    );
  } else {
    membershipEndDate = getMembershipEndDate(membershipStartDate, billingPeriod);
  }

  const payment = new Payment({
    userId,
    email: session.customer_email || data.user.email,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    status: "succeeded",
    stripeCustomerId,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    billingPeriod,
  });
  await payment.save();

  // Get auto-renewal preference from session metadata
  const isAutoRenew = session.metadata?.isAutoRenew === "true";
  const stripeSubscriptionId = session.subscription ? (session.subscription as string) : undefined;

  console.log(
    `🔄 Creating membership with isAutoRenew: ${isAutoRenew}, subscriptionId: ${stripeSubscriptionId || "none"}`,
  );

  // Initialize effective benefits from plan (first purchase)
  const userMembership = new UserMembership({
    userId,
    planId,
    paymentId: payment._id,
    status: "active",
    billingPeriod,
    startDate: membershipStartDate,
    endDate: membershipEndDate,
    isAutoRenew: isAutoRenew,
    stripeSubscriptionId: stripeSubscriptionId,

    // Initialize effective benefits from plan
    // Contractor benefits
    effectiveLeadsPerMonth: data.leadsPerMonth ?? null,
    effectiveAccessDelayHours: data.accessDelayHours ?? 24,
    effectiveRadiusKm: data.radiusKm ?? null,
    effectiveFeaturedListing: data.featuredListing ?? false,
    effectiveOffMarketAccess: data.offMarketAccess ?? false,
    effectivePublicityReferences: data.publicityReferences ?? false,
    effectiveVerifiedBadge: data.verifiedBadge ?? false,
    effectiveFinancingSupport: data.financingSupport ?? false,
    effectivePrivateNetwork: data.privateNetwork ?? false,

    // Customer benefits
    effectiveMaxProperties: data.maxProperties ?? null,
    effectivePropertyType: data.propertyType ?? "domestic",
    effectivePlatformFeePercentage: data.platformFeePercentage ?? 100,
    effectiveFreeCalculators: data.freeCalculators ?? false,
    effectiveUnlimitedRequests: data.unlimitedRequests ?? false,
    effectiveContractorReviewsVisible: data.contractorReviewsVisible ?? false,
    effectivePriorityContractorAccess: data.priorityContractorAccess ?? false,
    effectivePropertyValuationSupport: data.propertyValuationSupport ?? false,
    effectiveCertifiedAASWork: data.certifiedAASWork ?? false,
    effectiveFreeEvaluation: data.freeEvaluation ?? false,
  });
  await userMembership.save();

  // Send welcome email for new membership
  // Always send "new" email for first purchase (not renewal)
  await sendPaymentReceipt(
    session.customer_email || data.user.email,
    "membership",
    session.amount_total || 0,
    payment._id.toString(),
    {
      firstName: data.user.firstName,
      planName: data.name,
      billingPeriod,
      isNew: true, // Always true for createNewMembership (first purchase via checkout)
    },
  );

  return {
    membership: userMembership,
    payment,
    message: "Membership created successfully",
  };
};

// ==================== PAYMENT SUCCESS ====================
export const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  const result = await Payment.aggregate([
    {
      $match: {
        stripePaymentIntentId: paymentIntent.id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "usermemberships",
        let: { paymentId: "$_id", userId: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$paymentId", "$$paymentId"] }, { $eq: ["$userId", "$$userId"] }],
              },
            },
          },
        ],
        as: "membership",
      },
    },
    {
      $unwind: {
        path: "$membership",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        payment: "$$ROOT",
        user: 1,
        membership: 1,
      },
    },
  ]);

  if (!result.length) {
    // Payment doesn't exist yet - likely checkout.session.completed will handle it
    console.log(
      `ℹ️  Payment not found for payment_intent.succeeded: ${paymentIntent.id} - will be handled by checkout.session.completed`,
    );
    return {
      payment: null,
      message: "Payment record not found, will be created by checkout.session.completed",
    };
  }

  const data = result[0];

  // Check if payment was already processed
  const wasAlreadySucceeded = data.payment.status === "succeeded";

  await Payment.updateOne({ _id: data.payment._id }, { $set: { status: "succeeded" } });

  if (data.membership && data.membership.status !== "active") {
    await UserMembership.updateOne({ _id: data.membership._id }, { $set: { status: "active" } });
  }

  // Only send receipt if this is the first time payment succeeded
  // (avoid duplicate emails if webhook fires multiple times)
  if (!wasAlreadySucceeded) {
    const paymentType = data.payment.planId ? "membership" : "job";
    await sendPaymentReceipt(
      data.user.email,
      paymentType,
      paymentIntent.amount,
      data.payment._id.toString(),
      {
        firstName: data.user.firstName,
      },
    );
  }

  return {
    payment: data.payment,
    message: "Payment processed successfully",
  };
};

// ==================== PAYMENT FAILURE ====================
export const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const result = await Payment.aggregate([
    {
      $match: {
        stripePaymentIntentId: paymentIntent.id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        payment: "$$ROOT",
        user: 1,
      },
    },
  ]);

  if (!result.length) {
    throw new Error("Payment not found");
  }

  const data = result[0];
  const failureReason = paymentIntent.last_payment_error?.message || "Unknown error";

  await Payment.updateOne({ _id: data.payment._id }, { $set: { status: "failed", failureReason } });

  await sendPaymentFailedNotification(
    data.user.email,
    data.payment.amount,
    failureReason,
    undefined,
    `${ENV_CONFIG.FRONTEND_URL}/retry-payment/${data.payment._id}`,
  );

  return {
    payment: data.payment,
    message: "Payment failure processed",
  };
};
