import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IPayment } from "@models/types/payment";
import { PAYMENT_STATUSES, BILLING_PERIODS, DEFAULT_CURRENCY } from "@models/constants";

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
  // For recurring flows we use PaymentIntents; for one-time Stripe Checkout we store the Session ID
  stripePaymentIntentId: { type: String, required: false },
  stripeSessionId: { type: String },
  stripeSubscriptionId: { type: String },
  billingPeriod: {
    type: String,
    enum: BILLING_PERIODS,
    required: true,
  },
  failureReason: { type: String },
});

// Indexes for efficient queries
PaymentSchema.index({ userId: 1, email: 1, status: 1 });

export const Payment = createModel<IPayment>({
  schema: PaymentSchema,
  modelName: "Payment",
});
