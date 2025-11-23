import { Payment } from "@models/payment";
import { JobPayment } from "@models/payment";
import { JobRequest, Bid } from "@models/job";
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
import type { IPayment } from "@models/types/payment";
import type { IUserMembership } from "@models/types/membership";
import type { IJobRequest, IBid } from "@models/types/job";
import type { IUser } from "@models/types/user";
import { stripe } from "@config/stripe";
import {
  PaymentDetailsPayload,
  PaymentMembershipDetails,
  PaymentJobDetails,
  PaymentDetailType,
  PaymentMetadata,
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

export const processJobCompletionPayment = async (
  jobPaymentId: string | undefined,
  customerId: string,
  jobRequestId?: string,
  bidId?: string,
) => {
  try {
    let jobPayment: any = null;

    // If jobPaymentId is provided, use it
    if (jobPaymentId) {
      jobPayment = await JobPayment.findById(jobPaymentId);
    }

    // If not found and we have jobRequestId + bidId, try to find by those
    if (!jobPayment && jobRequestId && bidId) {
      jobPayment = await JobPayment.findOne({
        jobRequestId: new Types.ObjectId(jobRequestId),
        bidId: new Types.ObjectId(bidId),
        customerId: new Types.ObjectId(customerId),
      });
    }

    // If still not found, check if we can work with Bid/JobRequest data
    if (!jobPayment && jobRequestId && bidId) {
      const { Bid } = await import("@models/job");
      const { JobRequest } = await import("@models/job");
      const { getCurrentMembership } = await import("@services/membership/membership");

      const bid = await Bid.findById(bidId).lean();
      const jobRequest = await JobRequest.findById(jobRequestId).lean();

      if (!bid || !jobRequest) {
        throw new Error("Bid or JobRequest not found");
      }

      // Verify customer owns the job
      if (jobRequest.createdBy.toString() !== customerId) {
        throw new Error("You can only complete your own jobs");
      }

      // Check if deposit is paid
      if (!bid.depositPaid) {
        throw new Error("Deposit must be paid before completion payment");
      }

      // Check if there's an existing JobPayment (might have different customerId if created differently)
      const existingJobPayment = await JobPayment.findOne({
        jobRequestId: new Types.ObjectId(jobRequestId),
        bidId: new Types.ObjectId(bidId),
      });

      // If existing JobPayment found, use it if pre-start is paid
      if (existingJobPayment) {
        const preStartPaid =
          existingJobPayment.preStartStatus === "paid" ||
          existingJobPayment.preStartPaidAt !== undefined;

        if (!preStartPaid) {
          throw new Error("Pre-start payment must be completed before completion payment");
        }

        // Update preStartStatus to "paid" if it's not already (in case preStartPaidAt exists but status wasn't updated)
        if (existingJobPayment.preStartStatus !== "paid" && existingJobPayment.preStartPaidAt) {
          existingJobPayment.preStartStatus = "paid";
        }

        // Use existing JobPayment (update customerId if different)
        if (existingJobPayment.customerId.toString() !== customerId) {
          existingJobPayment.customerId = new Types.ObjectId(customerId);
        }

        // Save if we made any updates
        if (existingJobPayment.isModified()) {
          await existingJobPayment.save();
        }
        jobPayment = existingJobPayment;
      } else {
        // No JobPayment exists, check if pre-start was paid via other means
        // Check JobRequest paymentStatus as fallback
        const preStartPaidViaStatus =
          jobRequest.paymentStatus === "prestart_paid" || jobRequest.paymentStatus === "completed";

        if (!preStartPaidViaStatus) {
          throw new Error("Pre-start payment must be completed before completion payment");
        }

        // Get customer membership for platform fee calculation
        const membership = await getCurrentMembership(customerId);
        let platformFeePercentage = 0.01; // Default 1%
        if (membership) {
          const effectiveFee = membership.effectivePlatformFeePercentage;
          if (effectiveFee !== undefined && effectiveFee !== null) {
            platformFeePercentage = effectiveFee / 100;
          } else if ((membership.planId as any)?.platformFeePercentage !== undefined) {
            platformFeePercentage = ((membership.planId as any).platformFeePercentage || 0) / 100;
          }
        }

        // Calculate amounts (bidAmount is already in cents, use directly)
        const totalAmountCents = Math.round(bid.bidAmount);

        // Create JobPayment record
        const { createJobPayment } = await import("@services/payment/stripe");
        jobPayment = await createJobPayment(
          jobRequestId,
          customerId,
          bid.contractor.toString(),
          bidId,
          totalAmountCents,
        );

        // Update JobPayment with pre-start and deposit paid status
        jobPayment.preStartStatus = "paid";
        jobPayment.preStartPaidAt = new Date();
        jobPayment.depositStatus = "paid";
        jobPayment.depositPaidAt = bid.depositPaidAt || new Date();
        await jobPayment.save();
      }
    }

    if (!jobPayment) {
      const { SERVICE_ERROR_MESSAGES } = await import("@services/constants/validation");
      throw new Error(SERVICE_ERROR_MESSAGES.JOB_PAYMENT_NOT_FOUND);
    }

    const result = await processCompletionPayment(jobPayment._id.toString(), customerId);

    // Update job status
    await JobPayment.findByIdAndUpdate(jobPayment._id, {
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
    const paymentsFilter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (status && status !== "all") {
      paymentsFilter.status = status;
    }

    const allPayments = await Payment.find(paymentsFilter)
      .sort({ createdAt: -1 })
      .lean<LeanPayment[]>();

    const classified = await Promise.all(
      allPayments.map(async (payment) => {
        const metadata = normalizeMetadata(payment.metadata);
        const membershipRaw = await UserMembership.findOne({ paymentId: payment._id })
          .populate({ path: "planId", select: "name" })
          .sort({ createdAt: -1 })
          .lean();
        const membershipRecord = (membershipRaw ?? null) as LeanMembershipWithPlan;

        let paymentType = determinePaymentType(payment, metadata, membershipRecord);
        let bidContext: BidContext | null = null;

        if (paymentType !== "job") {
          bidContext = await findBidContext(payment._id);
          if (bidContext) {
            paymentType = "job";
          }
        }

        let purpose = "Payment";

        if (paymentType === "membership") {
          const membershipDetails = await buildMembershipDetails(payment, membershipRecord);
          purpose = membershipDetails.planName
            ? `Membership: ${membershipDetails.planName}`
            : "Membership";
        } else if (paymentType === "job") {
          const jobDetails = await buildJobDetails(payment, metadata, bidContext);
          const jobTitle = jobDetails.jobSummary?.title ?? "Job";
          purpose = `Job: ${jobTitle}`;
        }

        return {
          _id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt,
          email: payment.email,
          failureReason: payment.failureReason ?? null,
          type: paymentType,
          purpose,
        };
      }),
    );

    const filtered =
      type && type !== "all" ? classified.filter((item) => item.type === type) : classified;

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      payments: paginated,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  } catch (error) {
    console.error("Error getting payment history:", error);
    throw error;
  }
};

type LeanPayment = Pick<
  IPayment,
  | "_id"
  | "userId"
  | "planId"
  | "amount"
  | "currency"
  | "status"
  | "billingPeriod"
  | "failureReason"
  | "createdAt"
  | "updatedAt"
  | "metadata"
  | "email"
>;
type PopulatedPlan = { _id: Types.ObjectId; name?: string } | Types.ObjectId | undefined;
type LeanMembershipWithPlan =
  | (Pick<IUserMembership, "_id" | "status" | "endDate"> & { planId?: PopulatedPlan })
  | null;
type LeanJobRequestDoc = Pick<IJobRequest, "_id" | "title" | "service" | "status"> & {
  referenceNumber?: string | null;
  createdBy?: Types.ObjectId;
};
type LeanContractorDoc = Pick<IUser, "_id" | "firstName" | "lastName" | "contractor">;
type LeanCustomerDoc = Pick<IUser, "_id" | "firstName" | "lastName">;
type BidContext = {
  jobRequestId?: string | null;
  contractorId?: string | null;
  jobRequest?: LeanJobRequestDoc | null;
};

const toStringId = (value?: Types.ObjectId | string | null): string | null => {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
};

const extractPlanName = (plan: PopulatedPlan): string | null => {
  if (!plan) {
    return null;
  }

  if (typeof (plan as { name?: unknown }).name === "string") {
    return (plan as { name?: string }).name ?? null;
  }

  return null;
};

const normalizeMetadata = (rawMetadata: IPayment["metadata"]): PaymentMetadata => {
  if (!rawMetadata) {
    return {};
  }

  if (rawMetadata instanceof Map) {
    return Object.fromEntries(rawMetadata.entries()) as PaymentMetadata;
  }

  if (typeof (rawMetadata as any).toObject === "function") {
    return { ...(rawMetadata as any).toObject() } as PaymentMetadata;
  }

  return { ...(rawMetadata as Record<string, unknown>) } as PaymentMetadata;
};

const determinePaymentType = (
  payment: LeanPayment,
  metadata: PaymentMetadata,
  membership: LeanMembershipWithPlan,
): PaymentDetailType => {
  if (
    metadata.jobRequestId ||
    metadata.jobId ||
    metadata.paymentType?.startsWith?.("job") ||
    metadata.category === "job"
  ) {
    return "job";
  }

  if (payment.planId || membership || payment.billingPeriod) {
    return "membership";
  }

  return "general";
};

const buildMembershipDetails = async (
  payment: LeanPayment,
  membership: LeanMembershipWithPlan,
): Promise<PaymentMembershipDetails> => {
  let planName: string | null = extractPlanName(membership?.planId);

  if (!planName && payment.planId) {
    const plan = await MembershipPlan.findById(payment.planId)
      .select("name")
      .lean<{ name?: string } | null>();
    planName = plan?.name ?? null;
  }

  let cycleEnd: Date | null = membership?.endDate ?? null;
  if (!cycleEnd && payment.billingPeriod && payment.createdAt) {
    const computed = new Date(payment.createdAt);
    if (payment.billingPeriod === "monthly") {
      computed.setMonth(computed.getMonth() + 1);
    } else if (payment.billingPeriod === "yearly") {
      computed.setFullYear(computed.getFullYear() + 1);
    }
    cycleEnd = computed;
  }

  return {
    planName,
    status: membership?.status ?? payment.status,
    cycleEnd,
  };
};

const buildJobDetails = async (
  payment: LeanPayment,
  metadata: PaymentMetadata,
  bidContext: BidContext | null,
): Promise<PaymentJobDetails> => {
  const jobRequestId = metadata.jobRequestId ?? metadata.jobId ?? bidContext?.jobRequestId ?? null;
  const contractorId =
    metadata.contractorId ?? metadata.contractorID ?? bidContext?.contractorId ?? null;
  const customerId = toStringId(payment.userId as Types.ObjectId);

  const [jobRequestRaw, contractorRaw, customerRaw] = await Promise.all([
    jobRequestId
      ? JobRequest.findById(jobRequestId)
          .select("title service status referenceNumber createdBy")
          .lean()
      : Promise.resolve<unknown>(bidContext?.jobRequest ?? null),
    contractorId
      ? User.findById(contractorId).select("firstName lastName contractor.companyName").lean()
      : Promise.resolve<unknown>(null),
    customerId
      ? User.findById(customerId).select("firstName lastName").lean()
      : Promise.resolve<unknown>(null),
  ]);

  const jobRequest = (jobRequestRaw ?? null) as LeanJobRequestDoc | null;
  const contractor = (contractorRaw ?? null) as
    | (LeanContractorDoc & { contractor?: { companyName?: string } })
    | null;
  const customer = (customerRaw ?? null) as LeanCustomerDoc | null;
  const customerResolvedId = customer
    ? toStringId((customer._id as Types.ObjectId) ?? null)
    : toStringId(jobRequest?.createdBy ?? payment.userId);
  const customerParticipant =
    customer ??
    (jobRequest?.createdBy
      ? await User.findById(jobRequest.createdBy)
          .select("firstName lastName")
          .lean<LeanCustomerDoc | null>()
      : null);
  const contractorResolvedId = contractor
    ? toStringId((contractor._id as Types.ObjectId) ?? null)
    : toStringId(contractorId);
  const customerDisplay = customer ?? customerParticipant ?? null;

  return {
    jobId: toStringId(jobRequest?._id ?? jobRequestId),
    jobSummary: jobRequest
      ? {
          title: jobRequest.title ?? null,
          service: jobRequest.service ?? null,
          status: jobRequest.status ?? null,
          referenceNumber: (jobRequest as any).referenceNumber ?? null,
        }
      : null,
    participants: {
      contractor: contractor
        ? {
            id: contractorResolvedId,
            name: formatPersonName(contractor),
            companyName: contractor.contractor?.companyName ?? null,
          }
        : null,
      customer: customerDisplay
        ? {
            id: customerResolvedId,
            name: formatPersonName(customerDisplay),
          }
        : null,
    },
  };
};

const findBidContext = async (paymentId: string | Types.ObjectId): Promise<BidContext | null> => {
  const bid = await Bid.findOne({
    $or: [{ depositPaymentId: paymentId }, { completionPaymentId: paymentId }],
  })
    .populate({ path: "jobRequest", select: "title service status referenceNumber createdBy" })
    .lean<
      | (Pick<IBid, "jobRequest" | "contractor"> & {
          jobRequest?: (LeanJobRequestDoc & { _id: Types.ObjectId }) | Types.ObjectId;
        })
      | null
    >();

  if (!bid) {
    return null;
  }

  let jobRequest: LeanJobRequestDoc | null = null;
  let jobRequestId: string | null = null;

  if (bid.jobRequest) {
    if (typeof (bid.jobRequest as any)._id !== "undefined") {
      jobRequest = bid.jobRequest as unknown as LeanJobRequestDoc;
      jobRequestId = toStringId(jobRequest._id);
    } else {
      jobRequestId = toStringId(bid.jobRequest as Types.ObjectId);
    }
  }

  return {
    jobRequestId,
    contractorId: toStringId(bid.contractor as Types.ObjectId | undefined),
    jobRequest,
  };
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

    const paymentRecord = await Payment.findById(paymentId).lean<LeanPayment | null>();

    if (paymentRecord) {
      const metadata = normalizeMetadata(paymentRecord.metadata) as PaymentMetadata;
      const membershipRaw = await UserMembership.findOne({ paymentId: paymentRecord._id })
        .populate({ path: "planId", select: "name" })
        .sort({ createdAt: -1 })
        .lean();
      const membershipRecord = (membershipRaw ?? null) as LeanMembershipWithPlan;

      let paymentType = determinePaymentType(paymentRecord, metadata, membershipRecord);
      let bidContext: BidContext | null = null;

      if (paymentType !== "job") {
        bidContext = await findBidContext(paymentRecord._id);
        if (bidContext) {
          paymentType = "job";
        }
      }

      if (paymentType === "job") {
        return {
          id: paymentRecord._id.toString(),
          type: "job",
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          amountFormatted: formatAmountCents(paymentRecord.amount),
          currency: paymentRecord.currency,
          failureReason: paymentRecord.failureReason ?? null,
          createdAt: paymentRecord.createdAt,
          updatedAt: paymentRecord.updatedAt,
          details: {
            type: "job",
            data: await buildJobDetails(paymentRecord, metadata, bidContext),
          },
        };
      }

      if (paymentType === "membership") {
        return {
          id: paymentRecord._id.toString(),
          type: "membership",
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          amountFormatted: formatAmountCents(paymentRecord.amount),
          currency: paymentRecord.currency,
          failureReason: paymentRecord.failureReason ?? null,
          createdAt: paymentRecord.createdAt,
          updatedAt: paymentRecord.updatedAt,
          details: {
            type: "membership",
            data: await buildMembershipDetails(paymentRecord, membershipRecord),
          },
        };
      }

      return {
        id: paymentRecord._id.toString(),
        type: "general",
        status: paymentRecord.status,
        amount: paymentRecord.amount,
        amountFormatted: formatAmountCents(paymentRecord.amount),
        currency: paymentRecord.currency,
        failureReason: paymentRecord.failureReason ?? null,
        createdAt: paymentRecord.createdAt,
        updatedAt: paymentRecord.updatedAt,
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
          pipeline: [{ $project: { firstName: 1, lastName: 1, contractor: 1 } }],
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
                    companyName: jobPaymentAggregation.contractor.contractor?.companyName ?? null,
                  }
                : null,
              customer: jobPaymentAggregation.customer
                ? {
                    id: jobPaymentAggregation.customer._id?.toString() ?? null,
                    name: formatPersonName(jobPaymentAggregation.customer),
                  }
                : null,
            },
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
