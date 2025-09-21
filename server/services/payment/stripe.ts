import "dotenv/config";
import Stripe from "stripe";
import { SERVICE_ERROR_MESSAGES, SERVICE_CONSTANTS } from "../constants";
import { User } from "@models/user";
import { UserMembership } from "@models/user";
import { JobPayment } from "@models/payment";
import { OffMarketPayment } from "@models/payment";
import { getCurrentMembership } from "@services/membership/membership";
import {
  calculateDepositAmount,
  calculatePreStartAmount,
  calculateCompletionAmount,
  calculatePlatformFee,
  calculateRefundAmount,
  roundToCents,
} from "@utils/financial";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

// Stripe Connect configuration
const PLATFORM_FEE_PERCENTAGE = 0.01; // 1% platform fee
const ADMIN_FEE_PERCENTAGE = 0.07; // 7% admin fee for refunds
const STRIPE_FEE_PERCENTAGE = 0.03; // 3% stripe fee for refunds

// Create or retrieve Stripe customer
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  try {
    // Check if user already has a Stripe customer ID
    const user = await User.findById(userId);
    if (user && (user as any).stripeCustomerId) {
      return (user as any).stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId: userId,
      },
    });

    // Save customer ID to user
    await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });

    return customer.id;
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.STRIPE_CUSTOMER_ERROR, error);
    throw error;
  }
}

// Create payment intent for job payments
export async function createJobPaymentIntent(
  customerId: string,
  amount: number,
  jobRequestId: string,
  paymentType: "deposit" | "prestart" | "completion",
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: SERVICE_CONSTANTS.CURRENCY,
      customer: customerId,
      metadata: {
        jobRequestId,
        paymentType,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.PAYMENT_INTENT_ERROR, error);
    throw error;
  }
}

// Create job payment record and calculate amounts
export async function createJobPayment(
  jobRequestId: string,
  customerId: string,
  contractorId: string,
  bidId: string,
  totalAmount: number,
) {
  try {
    // Get customer's membership to determine platform fee
    const membership = await getCurrentMembership(customerId);
    const platformFeePercentage =
      (membership?.planId as any)?.tier === SERVICE_CONSTANTS.PREMIUM_TIER
        ? 0
        : PLATFORM_FEE_PERCENTAGE;

    // Calculate payment amounts using safe financial calculations
    const depositAmount = calculateDepositAmount(totalAmount); // 15% deposit
    const preStartAmount = calculatePreStartAmount(totalAmount); // 25% pre-start
    const completionAmount = calculateCompletionAmount(totalAmount, depositAmount, preStartAmount); // 60% completion
    const platformFeeAmount = calculatePlatformFee(totalAmount, platformFeePercentage * 100); // Convert to percentage

    const jobPayment = new JobPayment({
      jobRequestId,
      customerId,
      contractorId,
      bidId,
      totalAmount,
      depositAmount,
      preStartAmount,
      completionAmount,
      platformFeeAmount,
      platformFeePercentage,
      jobStatus: SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS,
    });

    await jobPayment.save();
    return jobPayment;
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.JOB_PAYMENT_ERROR, error);
    throw error;
  }
}

// Process job deposit payment
export async function processJobDeposit(
  jobPaymentId: string,
  customerId: string,
): Promise<{ paymentIntent: Stripe.PaymentIntent; jobPayment: any }> {
  try {
    const jobPayment = await JobPayment.findById(jobPaymentId);
    if (!jobPayment) {
      throw new Error(SERVICE_ERROR_MESSAGES.JOB_PAYMENT_NOT_FOUND);
    }

    const stripeCustomerId = await getOrCreateCustomer(customerId, "");
    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      jobPayment.depositAmount,
      jobPayment.jobRequestId.toString(),
      SERVICE_CONSTANTS.DEPOSIT_TYPE,
    );

    // Update job payment with payment intent ID
    jobPayment.depositPaymentIntentId = paymentIntent.id;
    jobPayment.depositStatus = SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS;
    await jobPayment.save();

    return { paymentIntent, jobPayment };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.DEPOSIT_PROCESSING_ERROR, error);
    throw error;
  }
}

// Process pre-start payment
export async function processPreStartPayment(
  jobPaymentId: string,
  customerId: string,
): Promise<{ paymentIntent: Stripe.PaymentIntent; jobPayment: any }> {
  try {
    const jobPayment = await JobPayment.findById(jobPaymentId);
    if (!jobPayment || jobPayment.depositStatus !== SERVICE_CONSTANTS.PAID_STATUS) {
      throw new Error(SERVICE_ERROR_MESSAGES.DEPOSIT_NOT_PAID);
    }

    const stripeCustomerId = await getOrCreateCustomer(customerId, "");
    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      jobPayment.preStartAmount,
      jobPayment.jobRequestId.toString(),
      SERVICE_CONSTANTS.PRESTART_TYPE,
    );

    jobPayment.preStartPaymentIntentId = paymentIntent.id;
    jobPayment.preStartStatus = SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS;
    await jobPayment.save();

    return { paymentIntent, jobPayment };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.PRESTART_PROCESSING_ERROR, error);
    throw error;
  }
}

// Process completion payment
export async function processCompletionPayment(
  jobPaymentId: string,
  customerId: string,
): Promise<{ paymentIntent: Stripe.PaymentIntent; jobPayment: any }> {
  try {
    const jobPayment = await JobPayment.findById(jobPaymentId);
    if (!jobPayment || jobPayment.preStartStatus !== SERVICE_CONSTANTS.PAID_STATUS) {
      throw new Error(SERVICE_ERROR_MESSAGES.PRESTART_NOT_PAID);
    }

    const stripeCustomerId = await getOrCreateCustomer(customerId, "");
    const paymentIntent = await createJobPaymentIntent(
      stripeCustomerId,
      jobPayment.completionAmount,
      jobPayment.jobRequestId.toString(),
      SERVICE_CONSTANTS.COMPLETION_TYPE,
    );

    jobPayment.completionPaymentIntentId = paymentIntent.id;
    jobPayment.completionStatus = SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS;
    await jobPayment.save();

    return { paymentIntent, jobPayment };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.COMPLETION_PROCESSING_ERROR, error);
    throw error;
  }
}

// Process contractor payout using Stripe Connect
export async function processContractorPayout(
  jobPaymentId: string,
  contractorId: string,
): Promise<{ transfer: Stripe.Transfer; jobPayment: any }> {
  try {
    const jobPayment = await JobPayment.findById(jobPaymentId);
    if (!jobPayment || jobPayment.completionStatus !== SERVICE_CONSTANTS.PAID_STATUS) {
      throw new Error(SERVICE_ERROR_MESSAGES.COMPLETION_NOT_PAID);
    }

    // Get contractor's Stripe Connect account
    const contractor = await User.findById(contractorId);
    if (!contractor || !(contractor as any).stripeConnectAccountId) {
      throw new Error(SERVICE_ERROR_MESSAGES.CONTRACTOR_NOT_FOUND);
    }

    // Calculate contractor amount (total - platform fee)
    const contractorAmount = jobPayment.totalAmount - jobPayment.platformFeeAmount;

    // Create transfer to contractor
    const transfer = await stripe.transfers.create({
      amount: contractorAmount,
      currency: SERVICE_CONSTANTS.CURRENCY,
      destination: (contractor as any).stripeConnectAccountId,
      metadata: {
        jobPaymentId: jobPaymentId,
        contractorId: contractorId,
      },
    });

    // Update job payment with transfer details
    jobPayment.contractorPayoutId = transfer.id;
    jobPayment.jobStatus = SERVICE_CONSTANTS.COMPLETED_STATUS;
    await jobPayment.save();

    return { transfer, jobPayment };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.PAYOUT_PROCESSING_ERROR, error);
    throw error;
  }
}

// Process refund with complex fee structure
export async function processRefund(
  paymentIntentId: string,
  amount: number,
  reason: string,
  jobPaymentId?: string,
  offMarketPaymentId?: string,
): Promise<{ refund: Stripe.Refund; paymentRecord: any }> {
  try {
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
      reason: SERVICE_CONSTANTS.REQUESTED_BY_CUSTOMER,
      metadata: {
        reason,
        jobPaymentId: jobPaymentId || "",
        offMarketPaymentId: offMarketPaymentId || "",
      },
    });

    // Calculate fees using safe financial calculations
    const stripeFee = roundToCents(amount * STRIPE_FEE_PERCENTAGE);
    const adminFee = roundToCents(amount * ADMIN_FEE_PERCENTAGE);
    const netRefundAmount = calculateRefundAmount(
      amount,
      ADMIN_FEE_PERCENTAGE * 100,
      STRIPE_FEE_PERCENTAGE * 100,
    );

    // Update payment record
    let paymentRecord;
    if (jobPaymentId) {
      paymentRecord = await JobPayment.findById(jobPaymentId);
      if (paymentRecord) {
        paymentRecord.refunds.push({
          amount: netRefundAmount,
          reason,
          stripeRefundId: refund.id,
          processedAt: new Date(),
          adminFee,
          stripeFee,
        });
        await paymentRecord.save();
      }
    } else if (offMarketPaymentId) {
      paymentRecord = await OffMarketPayment.findById(offMarketPaymentId);
      if (paymentRecord) {
        paymentRecord.refunds.push({
          amount: netRefundAmount,
          reason,
          stripeRefundId: refund.id,
          processedAt: new Date(),
          adminFee,
          stripeFee,
        });
        await paymentRecord.save();
      }
    }

    return { refund, paymentRecord };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.REFUND_PROCESSING_ERROR, error);
    throw error;
  }
}

// Create off-market payment
export async function createOffMarketPayment(
  listingId: string,
  contractorId: string,
  listingPrice: number,
  depositPercentage: number = 0.1,
): Promise<{ paymentIntent: Stripe.PaymentIntent; offMarketPayment: any }> {
  try {
    const depositAmount = roundToCents(listingPrice * depositPercentage);

    const offMarketPayment = new OffMarketPayment({
      listingId,
      contractorId,
      listingPrice,
      depositAmount,
      status: SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS,
    });

    await offMarketPayment.save();

    const stripeCustomerId = await getOrCreateCustomer(contractorId, "");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: SERVICE_CONSTANTS.CURRENCY,
      customer: stripeCustomerId,
      metadata: {
        listingId,
        paymentType: SERVICE_CONSTANTS.OFF_MARKET_DEPOSIT,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    offMarketPayment.depositPaymentIntentId = paymentIntent.id;
    await offMarketPayment.save();

    return { paymentIntent, offMarketPayment };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.OFF_MARKET_PAYMENT_ERROR, error);
    throw error;
  }
}

// Setup Stripe Connect account for contractor
export async function setupContractorConnect(
  contractorId: string,
): Promise<{ accountLink: Stripe.AccountLink; account: Stripe.Account }> {
  try {
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: SERVICE_CONSTANTS.EXPRESS_TYPE,
      country: "US",
      email: "", // Will be filled during onboarding
      metadata: {
        contractorId,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/contractor/connect/refresh`,
      return_url: `${process.env.FRONTEND_URL}/contractor/connect/success`,
      type: SERVICE_CONSTANTS.ACCOUNT_ONBOARDING,
    });

    // Save account ID to contractor
    await User.findByIdAndUpdate(contractorId, {
      stripeConnectAccountId: account.id,
      stripeConnectStatus: SERVICE_CONSTANTS.DEFAULT_PAYMENT_STATUS,
    });

    return { accountLink, account };
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.CONTRACTOR_CONNECT_SETUP_ERROR, error);
    throw error;
  }
}

// Get contractor's Stripe Connect dashboard link
export async function getContractorDashboard(contractorId: string): Promise<string> {
  try {
    const contractor = await User.findById(contractorId);
    if (!contractor || !(contractor as any).stripeConnectAccountId) {
      throw new Error(SERVICE_ERROR_MESSAGES.CONTRACTOR_NOT_FOUND);
    }

    const loginLink = await stripe.accounts.createLoginLink(
      (contractor as any).stripeConnectAccountId,
    );

    return loginLink.url;
  } catch (error) {
    console.error(SERVICE_ERROR_MESSAGES.CONTRACTOR_DASHBOARD_ERROR, error);
    throw error;
  }
}
