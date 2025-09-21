import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IPayment } from "@models/types/payment";
import {
  PAYMENT_STATUSES,
  BILLING_PERIODS,
  BILLING_TYPES,
  DEFAULT_CURRENCY,
} from "@models/constants";

const PaymentSchema: Schema<IPayment> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: DEFAULT_CURRENCY },
  status: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: "pending",
  },
  stripeCustomerId: { type: String, required: true },
  stripePaymentIntentId: { type: String, required: true },
  stripeSubscriptionId: { type: String },
  billingPeriod: {
    type: String,
    enum: BILLING_PERIODS,
    required: true,
  },
  billingType: {
    type: String,
    enum: BILLING_TYPES,
    required: true,
    default: "recurring",
  },
  failureReason: { type: String },
});

// Indexes for efficient queries
PaymentSchema.index({ userId: 1, email: 1, status: 1 });

export const Payment = createModel<IPayment>({
  schema: PaymentSchema,
  modelName: "Payment",
});
