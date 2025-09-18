import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  amount: number; // in cents
  currency: string;
  status: "pending" | "succeeded" | "failed";

  // Stripe essentials
  stripeCustomerId: string;
  stripePaymentIntentId: string;
  stripeSubscriptionId?: string; // Only for recurring

  // Billing details
  billingPeriod: "monthly" | "yearly";
  billingType: "recurring" | "one_time";
  failureReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    stripeCustomerId: { type: String, required: true },
    stripePaymentIntentId: { type: String, required: true },
    stripeSubscriptionId: { type: String },
    billingPeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    billingType: {
      type: String,
      enum: ["recurring", "one_time"],
      required: true,
      default: "recurring",
    },
    failureReason: { type: String },
  },
  { timestamps: true },
);

// Indexes for efficient queries
PaymentSchema.index({ userId: 1, email: 1, status: 1 });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
