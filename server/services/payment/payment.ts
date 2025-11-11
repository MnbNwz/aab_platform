import { Payment } from "@models/payment";
import { JobPayment } from "@models/payment";
import { User } from "@models/user";
import { UserMembership } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { ENV_CONFIG } from "@config/env";
import {
  getOrCreateCustomer,
  createJobPaymentIntent,
  createJobPayment,
  processJobDeposit,
  processPreStartPayment,
  processCompletionPayment,
  processRefund,
  setupContractorConnect,
  getContractorDashboard,
} from "./stripe";
import { getStripePriceId } from "@services/membership/membership";
import { calculateYearlyDiscount, calculatePrepaidRebate } from "@utils/financial";
import { getMembershipEndDate } from "@utils/core";
import { Types } from "@models/types";
import mongoose from "mongoose";
import { stripe } from "@config/stripe";
import {
  PaymentDetailsPayload,
  PaymentMembershipDetails,
  PaymentJobDetails,
  PaymentDetailType,
} from "@services/payment/types/paymentDetails";
import { formatAmountCents, formatPersonName } from "@services/payment/helpers";

// MEMBERSHIP PAYMENTS
export const createMembershipCheckout = async (
  userId: string,
  planId: string,
  billingPeriod: "monthly" | "yearly",
  isPrepaid: boolean = false,
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get membership plan details
    const membershipPlan = await MembershipPlan.findById(planId);
    if (!membershipPlan) {
      throw new Error("Membership plan not found");
    }

    // Check contractor minimum 4 months requirement
    if (membershipPlan.userType === "contractor" && billingPeriod === "monthly") {
      // For contractors, enforce minimum 4 months for monthly billing
      // This would be handled in the frontend, but we can add validation here too
    }

    // Calculate amount based on billing period with safe financial calculations
    let amount =
      billingPeriod === "monthly" ? membershipPlan.monthlyPrice : membershipPlan.yearlyPrice;

    // Apply 15% discount for yearly billing
    if (billingPeriod === "yearly") {
      amount = calculateYearlyDiscount(amount);
    }

    // Apply 25% rebate for prepaid (4+ months)
    if (isPrepaid && billingPeriod === "yearly") {
      amount = calculatePrepaidRebate(amount);
    }

    // Create Stripe customer if not exists
    const stripeCustomerId = await getOrCreateCustomer(userId, user.email);

    // Create payment intent for membership
    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      amount,
      "membership",
      "deposit",
    );

    // Create payment record
    const payment = new Payment({
      userId,
      email: user.email,
      amount: amount,
      currency: "usd",
      status: "pending",
      stripeCustomerId,
      stripePaymentIntentId: paymentIntent.id,
      billingPeriod,
      planId: membershipPlan._id,
    });

    await payment.save();

    return {
      paymentIntent,
      payment,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating membership checkout:", error);
    throw error;
  }
};

// Create one-time membership payment using Stripe Checkout
export const createOneTimeMembershipCheckout = async (
  userId: string,
  planId: string,
  billingPeriod: "monthly" | "yearly",
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get membership plan details
    const membershipPlan = await MembershipPlan.findById(planId);
    if (!membershipPlan) {
      throw new Error("Membership plan not found");
    }

    // Get the correct Stripe Price ID (simplified - always one-time initially)
    const stripePriceId = getStripePriceId(membershipPlan, billingPeriod);

    // Create Stripe customer if not exists
    const stripeCustomerId = await getOrCreateCustomer(userId, user.email);

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment
      success_url: `${ENV_CONFIG.FRONTEND_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV_CONFIG.FRONTEND_URL}/membership/cancel`,
      metadata: {
        userId,
        planId,
        billingPeriod,
      },
    });

    // Create payment record
    const payment = new Payment({
      userId,
      email: user.email,
      amount:
        billingPeriod === "monthly" ? membershipPlan.monthlyPrice : membershipPlan.yearlyPrice,
      currency: "usd",
      status: "pending",
      stripeCustomerId,
      stripeSessionId: session.id,
      billingPeriod,
      planId: membershipPlan._id,
    });

    await payment.save();

    return {
      sessionId: session.id,
      url: session.url,
      payment,
    };
  } catch (error) {
    console.error("Error creating one-time membership checkout:", error);
    throw error;
  }
};

export const confirmMembershipPayment = async (paymentIntentId: string) => {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    payment.status = "succeeded";
    let membershipPlan =
      payment.planId != null
        ? await MembershipPlan.findById(payment.planId)
        : await MembershipPlan.findOne({
            $or: [{ monthlyPrice: payment.amount }, { yearlyPrice: payment.amount }],
          });

    if (!membershipPlan) {
      membershipPlan = await MembershipPlan.findOne({
        $or: [{ monthlyPrice: payment.amount }, { yearlyPrice: payment.amount }],
      });
    }

    if (membershipPlan && !payment.planId) {
      payment.planId = membershipPlan._id;
    }

    await payment.save();

    if (!membershipPlan) {
      throw new Error("Membership plan not found for this payment");
    }

    // Update user membership with safe date calculations
    const startDate = new Date();
    const endDate = getMembershipEndDate(startDate, payment.billingPeriod);

    await UserMembership.findOneAndUpdate(
      { userId: payment.userId },
      {
        planId: membershipPlan._id,
        paymentId: payment._id,
        status: "active",
        startDate,
        endDate,
      },
      { upsert: true },
    );

    return payment;
  } catch (error) {
    console.error("Error confirming membership payment:", error);
    throw error;
  }
};

// Confirm one-time membership payment from Stripe Checkout Session
export const confirmOneTimeMembershipPayment = async (sessionId: string) => {
  try {
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Update payment status
    payment.status = "succeeded";
    payment.stripePaymentIntentId = session.payment_intent as string;
    if (
      !payment.planId &&
      session.metadata?.planId &&
      mongoose.Types.ObjectId.isValid(session.metadata.planId)
    ) {
      payment.planId = new mongoose.Types.ObjectId(session.metadata.planId as string);
    }
    await payment.save();

    // Get membership plan details
    const membershipPlan = await MembershipPlan.findById(payment.planId);
    if (!membershipPlan) {
      throw new Error("Membership plan not found");
    }

    // Calculate membership duration based on billing period
    const startDate = new Date();
    const endDate = new Date();

    if (payment.billingPeriod === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create or update user membership
    await UserMembership.findOneAndUpdate(
      { userId: payment.userId },
      {
        planId: membershipPlan._id,
        paymentId: payment._id,
        status: "active",
        startDate,
        endDate,
      },
      { upsert: true },
    );

    return payment;
  } catch (error) {
    console.error("Error confirming one-time membership payment:", error);
    throw error;
  }
};

// JOB PAYMENTS
export const createJobPaymentRecord = async (
  jobRequestId: string,
  customerId: string,
  contractorId: string,
  bidId: string,
  totalAmount: number,
) => {
  try {
    const jobPayment = await createJobPayment(
      jobRequestId,
      customerId,
      contractorId,
      bidId,
      totalAmount,
    );

    return jobPayment;
  } catch (error) {
    console.error("Error creating job payment:", error);
    throw error;
  }
};

export const processJobDepositPayment = async (jobPaymentId: string, customerId: string) => {
  try {
    // Optimistic update - update status immediately
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      depositStatus: "pending",
      jobStatus: "in_progress",
    });

    const result = await processJobDeposit(jobPaymentId, customerId);

    // Update with actual payment intent details
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      depositPaymentIntentId: result.paymentIntent.id,
      depositStatus: "pending",
    });

    return result;
  } catch (error) {
    // Rollback optimistic update on error
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      depositStatus: "failed",
      jobStatus: "pending",
    });
    console.error("Error processing job deposit:", error);
    throw error;
  }
};

export const processJobPreStartPayment = async (jobPaymentId: string, customerId: string) => {
  try {
    const result = await processPreStartPayment(jobPaymentId, customerId);

    // Update job status
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      jobStatus: "prestart_paid",
      preStartPaidAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Error processing job pre-start:", error);
    throw error;
  }
};

export const processJobCompletionPayment = async (jobPaymentId: string, customerId: string) => {
  try {
    const result = await processCompletionPayment(jobPaymentId, customerId);

    // Update job status
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      jobStatus: "in_progress",
      completionPaidAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Error processing job completion:", error);
    throw error;
  }
};

export const processJobRefundPayment = async (
  jobPaymentId: string,
  paymentIntentId: string,
  amount: number,
  reason: string,
) => {
  try {
    const result = await processRefund(paymentIntentId, amount, reason, jobPaymentId);

    // Update job payment status
    await JobPayment.findByIdAndUpdate(jobPaymentId, {
      jobStatus: "cancelled",
    });

    return result;
  } catch (error) {
    console.error("Error processing job refund:", error);
    throw error;
  }
};

// STRIPE CONNECT
export const setupContractorConnectAccount = async (contractorId: string) => {
  try {
    const result = await setupContractorConnect(contractorId);
    return result;
  } catch (error) {
    console.error("Error setting up contractor connect:", error);
    throw error;
  }
};

export const getContractorDashboardLink = async (contractorId: string) => {
  try {
    const dashboardUrl = await getContractorDashboard(contractorId);
    return { dashboardUrl };
  } catch (error) {
    console.error("Error getting contractor dashboard:", error);
    throw error;
  }
};

export const getConnectAccountStatus = async (contractorId: string) => {
  try {
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }

    return {
      hasConnectAccount: !!(contractor as any).stripeConnectAccountId,
      connectStatus: (contractor as any).stripeConnectStatus || "not_setup",
      connectAccountId: (contractor as any).stripeConnectAccountId,
    };
  } catch (error) {
    console.error("Error getting connect status:", error);
    throw error;
  }
};

// PAYMENT MANAGEMENT (optimized with aggregation)
export const getPaymentHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  type?: string,
) => {
  try {
    const skip = (page - 1) * limit;

    // Build match filter
    const matchFilter: any = { userId: new mongoose.Types.ObjectId(userId) };

    // Add status filter if provided
    if (status && status !== "all") {
      matchFilter.status = status;
    }

    // Add type filter if provided
    const typeFilter: any = {};
    if (type && type !== "all") {
      switch (type) {
        case "membership":
          typeFilter.planId = { $exists: true, $ne: null };
          break;
        case "job":
          // Only for customers - contractors don't pay for jobs
          typeFilter.jobRequestId = { $exists: true, $ne: null };
          break;
      }
    }

    // Optimized aggregation with only required fields for performance and security
    const pipeline = [
      { $match: { ...matchFilter, ...typeFilter } },

      // Add membership plan info (only plan details)
      {
        $lookup: {
          from: "usermemberships",
          localField: "userId",
          foreignField: "userId",
          as: "membership",
          pipeline: [
            { $match: { status: "active" } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "membershipplans",
                localField: "planId",
                foreignField: "_id",
                as: "plan",
                pipeline: [{ $project: { name: 1, tier: 1 } }],
              },
            },
            {
              $addFields: {
                plan: { $arrayElemAt: ["$plan", 0] },
              },
            },
            // Only return plan object
            { $project: { plan: 1 } },
          ],
        },
      },

      // Add job details if it's a job payment (only essential fields)
      {
        $lookup: {
          from: "jobrequests",
          localField: "jobRequestId",
          foreignField: "_id",
          as: "jobDetails",
          pipeline: [{ $project: { title: 1, service: 1, status: 1 } }],
        },
      },

      // Transform data
      {
        $addFields: {
          membership: { $arrayElemAt: ["$membership", 0] },
          jobDetails: { $arrayElemAt: ["$jobDetails", 0] },
        },
      },

      // Add purpose field to identify payment type
      {
        $addFields: {
          purpose: {
            $cond: {
              if: { $ne: ["$membership", null] },
              then: { $concat: ["Membership: ", "$membership.plan.name"] },
              else: {
                $cond: {
                  if: { $ne: ["$jobDetails", null] },
                  then: { $concat: ["Job: ", "$jobDetails.title"] },
                  else: "Payment",
                },
              },
            },
          },
        },
      },

      // Project only required fields for frontend
      {
        $project: {
          _id: 1,
          amount: 1,
          currency: 1,
          status: 1,
          createdAt: 1,
          email: 1,
          failureReason: 1,
          purpose: 1,
        },
      },

      // Sort by creation date
      { $sort: { createdAt: -1 } },

      // Facet for pagination and count
      {
        $facet: {
          payments: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await Payment.aggregate(pipeline as any);
    const payments = result.payments;
    const total = result.total[0]?.count || 0;

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting payment history:", error);
    throw error;
  }
};

export const getPaymentDetails = async (
  paymentId: string,
): Promise<
  | PaymentDetailsPayload<"membership", PaymentMembershipDetails>
  | PaymentDetailsPayload<"job", PaymentJobDetails>
  | PaymentDetailsPayload<"general", null>
  | null
> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return null;
    }

    const [paymentAggregation] = await Payment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(paymentId),
        },
      },
      {
        $lookup: {
          from: "usermemberships",
          let: { paymentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$paymentId", "$$paymentId"],
                },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "membershipplans",
                localField: "planId",
                foreignField: "_id",
                as: "plan",
                pipeline: [{ $project: { name: 1 } }],
              },
            },
            {
              $addFields: {
                plan: { $arrayElemAt: ["$plan", 0] },
              },
            },
          ],
          as: "membership",
        },
      },
      {
        $lookup: {
          from: "membershipplans",
          localField: "planId",
          foreignField: "_id",
          as: "paymentPlan",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          membership: { $arrayElemAt: ["$membership", 0] },
          paymentPlan: { $arrayElemAt: ["$paymentPlan", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          amount: 1,
          currency: 1,
          status: 1,
          billingPeriod: 1,
          failureReason: 1,
          email: 1,
          createdAt: 1,
          updatedAt: 1,
          membership: 1,
          paymentPlan: 1,
        },
      },
    ]);

    if (paymentAggregation) {
      const isMembershipPayment =
        !!paymentAggregation.membership || !!paymentAggregation.billingPeriod;

      const baseResponse = {
        id: paymentAggregation._id.toString(),
        type: (isMembershipPayment ? "membership" : "general") as PaymentDetailType,
        status: paymentAggregation.status,
        amount: paymentAggregation.amount,
        amountFormatted: formatAmountCents(paymentAggregation.amount),
        currency: paymentAggregation.currency,
        failureReason: paymentAggregation.failureReason ?? null,
        createdAt: paymentAggregation.createdAt,
        updatedAt: paymentAggregation.updatedAt,
      };

      if (isMembershipPayment) {
        let computedCycleEnd = paymentAggregation.membership?.endDate ?? null;
        if (!computedCycleEnd && paymentAggregation.billingPeriod && paymentAggregation.createdAt) {
          const start = new Date(paymentAggregation.createdAt);
          if (paymentAggregation.billingPeriod === "monthly") {
            start.setMonth(start.getMonth() + 1);
          } else if (paymentAggregation.billingPeriod === "yearly") {
            start.setFullYear(start.getFullYear() + 1);
          }
          computedCycleEnd = start;
        }

        let planName =
          paymentAggregation.membership?.plan?.name ?? paymentAggregation.paymentPlan?.name ?? null;

        if (!planName && paymentAggregation.userId) {
          const latestMembership = await UserMembership.findOne({
            userId: paymentAggregation.userId,
          })
            .sort({ updatedAt: -1 })
            .populate({ path: "planId", select: "name" })
            .lean<{ planId?: { name?: string } } | null>();

          planName = (latestMembership as any)?.planId?.name ?? null;
        }

        return {
          ...baseResponse,
          type: "membership",
          details: {
            type: "membership",
            data: {
              planName,
              status: paymentAggregation.membership?.status ?? paymentAggregation.status,
              cycleEnd: computedCycleEnd,
            },
          },
        };
      }

      return {
        ...baseResponse,
        type: "general",
        details: {
          type: "general",
          data: null,
        },
      };
    }

    const [jobPaymentAggregation] = await JobPayment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(paymentId),
        },
      },
      {
        $lookup: {
          from: "jobrequests",
          localField: "jobRequestId",
          foreignField: "_id",
          as: "jobRequest",
          pipeline: [
            {
              $project: {
                _id: 1,
                title: 1,
                service: 1,
                status: 1,
                referenceNumber: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "contractorId",
          foreignField: "_id",
          as: "contractor",
          pipeline: [{ $project: { firstName: 1, lastName: 1, companyName: 1 } }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      {
        $addFields: {
          jobRequest: { $arrayElemAt: ["$jobRequest", 0] },
          contractor: { $arrayElemAt: ["$contractor", 0] },
          customer: { $arrayElemAt: ["$customer", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          jobStatus: 1,
          jobRequest: 1,
          contractor: 1,
          customer: 1,
          refunds: 1,
          milestones: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (jobPaymentAggregation) {
      return {
        id: jobPaymentAggregation._id.toString(),
        type: "job",
        status: jobPaymentAggregation.jobStatus,
        amount: jobPaymentAggregation.totalAmount,
        amountFormatted: formatAmountCents(jobPaymentAggregation.totalAmount),
        currency: "usd",
        failureReason: null,
        createdAt: jobPaymentAggregation.createdAt,
        updatedAt: jobPaymentAggregation.updatedAt,
        details: {
          type: "job",
          data: {
            jobId: jobPaymentAggregation.jobRequest?._id?.toString() ?? null,
            jobSummary: jobPaymentAggregation.jobRequest
              ? {
                  title: jobPaymentAggregation.jobRequest.title ?? null,
                  service: jobPaymentAggregation.jobRequest.service ?? null,
                  status: jobPaymentAggregation.jobRequest.status ?? null,
                  referenceNumber: jobPaymentAggregation.jobRequest.referenceNumber ?? null,
                }
              : null,
            participants: {
              contractor: jobPaymentAggregation.contractor
                ? {
                    id: jobPaymentAggregation.contractor._id?.toString() ?? null,
                    name: formatPersonName(jobPaymentAggregation.contractor),
                    companyName: jobPaymentAggregation.contractor.companyName ?? null,
                  }
                : null,
              customer: jobPaymentAggregation.customer
                ? {
                    id: jobPaymentAggregation.customer._id?.toString() ?? null,
                    name: formatPersonName(jobPaymentAggregation.customer),
                  }
                : null,
            },
            refunds:
              jobPaymentAggregation.refunds?.map((refund: any) => ({
                amount: refund.amount,
                amountFormatted: formatAmountCents(refund.amount),
                reason: refund.reason,
                processedAt: refund.processedAt,
              })) ?? [],
            milestones:
              jobPaymentAggregation.milestones?.map((milestone: any) => ({
                name: milestone.name,
                status: milestone.status,
                completedAt: milestone.completedAt ?? null,
              })) ?? [],
          },
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting payment details:", error);
    throw error;
  }
};

export const getPaymentStatistics = async (userId: string) => {
  try {
    const stats = await Payment.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
      }
    );
  } catch (error) {
    console.error("Error getting payment stats:", error);
    throw error;
  }
};
