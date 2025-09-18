import mongoose, { Schema, Document } from "mongoose";

export interface IJobPayment extends Document {
  _id: mongoose.Types.ObjectId;
  jobRequestId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  contractorId: mongoose.Types.ObjectId;
  bidId: mongoose.Types.ObjectId;

  // Payment amounts (in cents)
  totalAmount: number;
  depositAmount: number; // 15% of total
  preStartAmount: number; // 25% of total
  completionAmount: number; // 60% of total

  // Platform fees
  platformFeeAmount: number;
  platformFeePercentage: number; // 1% for Basic/Standard, 0% for Premium

  // Payment status for each stage
  depositStatus: "pending" | "paid" | "failed" | "refunded";
  preStartStatus: "pending" | "paid" | "failed" | "refunded";
  completionStatus: "pending" | "paid" | "failed" | "refunded";

  // Stripe payment intents
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
  refunds: {
    amount: number;
    reason: string;
    stripeRefundId: string;
    processedAt: Date;
    adminFee: number; // 7% admin fee
    stripeFee: number; // 3% stripe fee
  }[];

  // Job status tracking
  jobStatus:
    | "pending"
    | "deposit_paid"
    | "prestart_paid"
    | "in_progress"
    | "completed"
    | "cancelled";

  createdAt: Date;
  updatedAt: Date;
}

const JobPaymentSchema: Schema<IJobPayment> = new Schema(
  {
    jobRequestId: {
      type: Schema.Types.ObjectId,
      ref: "JobRequest",
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
    },
    totalAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    preStartAmount: { type: Number, required: true },
    completionAmount: { type: Number, required: true },
    platformFeeAmount: { type: Number, required: true },
    platformFeePercentage: { type: Number, required: true },
    depositStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    preStartStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    completionStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    depositPaymentIntentId: { type: String },
    preStartPaymentIntentId: { type: String },
    completionPaymentIntentId: { type: String },
    contractorPayoutId: { type: String },
    platformPayoutId: { type: String },
    depositPaidAt: { type: Date },
    preStartPaidAt: { type: Date },
    completionPaidAt: { type: Date },
    refunds: [
      {
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        stripeRefundId: { type: String, required: true },
        processedAt: { type: Date, required: true },
        adminFee: { type: Number, required: true },
        stripeFee: { type: Number, required: true },
      },
    ],
    jobStatus: {
      type: String,
      enum: ["pending", "deposit_paid", "prestart_paid", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Indexes for efficient queries
JobPaymentSchema.index({ jobRequestId: 1 });
JobPaymentSchema.index({ customerId: 1, jobStatus: 1 });
JobPaymentSchema.index({ contractorId: 1, jobStatus: 1 });

export const JobPayment = mongoose.model<IJobPayment>("JobPayment", JobPaymentSchema);
