// Payment-related type definitions
import { Document, Types } from "./mongoose";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  email: string;
  amount: number; // in cents
  currency: string;
  status: "pending" | "succeeded" | "failed";

  // Stripe essentials
  stripeCustomerId: string;
  stripePaymentIntentId?: string; // Recurring
  stripeSessionId?: string; // One-time (Stripe Checkout)
  stripeSubscriptionId?: string; // Only for recurring

  // Billing details
  billingPeriod: "monthly" | "yearly";
  failureReason?: string;

  // Metadata
  planId?: Types.ObjectId;
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export interface IJobPayment extends Document {
  _id: Types.ObjectId;
  jobRequestId: Types.ObjectId;
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  bidId: Types.ObjectId;

  // Payment amounts (in cents)
  totalAmount: number;
  depositAmount: number;
  preStartAmount: number;
  completionAmount: number;

  // Platform fees
  platformFeeAmount: number;
  platformFeePercentage: number;

  // Payment status tracking
  depositStatus: "pending" | "paid" | "failed" | "refunded";
  preStartStatus: "pending" | "paid" | "failed" | "refunded";
  completionStatus: "pending" | "paid" | "failed" | "refunded";

  // Stripe payment intent IDs
  depositPaymentIntentId?: string;
  preStartPaymentIntentId?: string;
  completionPaymentIntentId?: string;

  // Stripe Connect for contractor payouts
  contractorPayoutId?: string;
  platformPayoutId?: string;

  // Payment dates
  depositPaidAt?: Date;
  preStartPaidAt?: Date;
  completionPaidAt?: Date;

  // Refund information
  refunds: Array<{
    amount: number;
    reason: string;
    stripeRefundId: string;
    processedAt: Date;
    adminFee: number;
    stripeFee: number;
  }>;

  // Job status tracking
  jobStatus: "pending" | "in_progress" | "completed" | "cancelled";
  milestones: Array<{
    name: string;
    status: "pending" | "completed";
    completedAt?: Date;
  }>;

  // Metadata
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}
