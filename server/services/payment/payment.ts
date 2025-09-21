import { Payment } from "@models/payment";
import { JobPayment } from "@models/payment";
import { User } from "@models/user";
import { UserMembership } from "@models/user";
import { MembershipPlan } from "@models/membership";
import { sendPaymentReceipt } from "@utils/email";
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
import {
  calculateYearlyDiscount,
  calculatePrepaidRebate,
  calculateCancellationFee,
} from "@utils/financial";
import { getMembershipEndDate, getDaysRemaining } from "@utils/core";
import { Types } from "@models/types";

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
      billingType: "recurring",
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

export const confirmMembershipPayment = async (paymentIntentId: string) => {
  try {
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    payment.status = "succeeded";
    await payment.save();

    // Get the membership plan to get the correct planId
    const membershipPlan = await MembershipPlan.findOne({
      $or: [{ monthlyPrice: payment.amount }, { yearlyPrice: payment.amount }],
    });

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

    // Send payment receipt notification
    await sendPaymentReceipt(
      payment.userId.toString(),
      "membership",
      payment.amount,
      payment._id.toString(),
    );

    return payment;
  } catch (error) {
    console.error("Error confirming membership payment:", error);
    throw error;
  }
};

export const cancelMembership = async (userId: string, cancellationReason?: string) => {
  try {
    // Get current membership
    const membership = await UserMembership.findOne({ userId, status: "active" });
    if (!membership) {
      throw new Error("No active membership found");
    }

    // Calculate cancellation fee based on time remaining using safe date calculations
    const now = new Date();
    const daysRemaining = getDaysRemaining(membership.endDate);

    let cancellationFee = 0;
    let refundAmount = 0;

    if (daysRemaining > 30) {
      // >30 days: deposit lost (no refund)
      cancellationFee = 100; // 100% of payment
      refundAmount = 0;
    } else {
      // ≤30 days: 5% fee
      const membershipPlan = await MembershipPlan.findById(membership.planId);
      if (membershipPlan) {
        const totalPaid =
          membership.billingPeriod === "monthly"
            ? membershipPlan.monthlyPrice
            : membershipPlan.yearlyPrice;
        cancellationFee = calculateCancellationFee(totalPaid);
        refundAmount = totalPaid - cancellationFee;
      }
    }

    // Update membership status
    await UserMembership.findOneAndUpdate(
      { userId },
      {
        status: "cancelled",
        endDate: new Date(),
        cancellationReason,
        cancellationFee,
        refundAmount,
      },
    );

    // Cancel any active subscriptions
    const payments = await Payment.find({
      userId,
      status: "succeeded",
      billingType: "recurring",
    });

    for (const payment of payments) {
      if (payment.stripeSubscriptionId) {
        // Cancel Stripe subscription
        // Note: This would require additional Stripe API calls
      }
    }

    return {
      success: true,
      message: "Membership cancelled successfully",
      cancellationFee,
      refundAmount,
      daysRemaining,
    };
  } catch (error) {
    console.error("Error cancelling membership:", error);
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
      jobStatus: "deposit_paid",
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
export const getPaymentHistory = async (userId: string, page: number = 1, limit: number = 10) => {
  try {
    const skip = (page - 1) * limit;

    // Optimized aggregation with related data
    const pipeline = [
      { $match: { userId: new (await import("mongoose")).Types.ObjectId(userId) } },

      // Add membership plan info for context
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
          ],
        },
      },

      // Add job details if it's a job payment
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

export const getPaymentDetails = async (paymentId: string) => {
  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
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
