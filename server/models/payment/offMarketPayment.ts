import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IOffMarketPayment } from "@models/types/payment";
import { OFF_MARKET_PAYMENT_STATUSES, UNDERWRITING_STATUSES } from "@models/constants";

const OffMarketPaymentSchema = new Schema<IOffMarketPayment>({
  listingId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  contractorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  listingPrice: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  financingAmount: { type: Number },
  status: {
    type: String,
    enum: OFF_MARKET_PAYMENT_STATUSES,
    default: "pending",
  },
  depositPaymentIntentId: { type: String },
  financingPaymentIntentId: { type: String },
  stripeCustomerId: { type: String },
  depositPaidAt: { type: Date },
  financingApprovedAt: { type: Date },
  financing: {
    isApproved: { type: Boolean, default: false },
    isRequested: { type: Boolean, default: false },
    approvedAmount: { type: Number },
    terms: { type: String },
    interestRate: { type: Number },
    termMonths: { type: Number },
    underwritingStatus: {
      type: String,
      enum: UNDERWRITING_STATUSES,
      default: "pending",
    },
  },
  refunds: [
    {
      amount: { type: Number, required: true },
      reason: { type: String, required: true },
      stripeRefundId: { type: String },
      adminFee: { type: Number },
      stripeFee: { type: Number },
      processedAt: { type: Date, required: true },
    },
  ],
  metadata: { type: Schema.Types.Mixed },
});

// Indexes for efficient queries
OffMarketPaymentSchema.index({ listingId: 1 });
OffMarketPaymentSchema.index({ contractorId: 1 });
OffMarketPaymentSchema.index({ status: 1 });

export const OffMarketPayment = createModel<IOffMarketPayment>({
  schema: OffMarketPaymentSchema,
  modelName: "OffMarketPayment",
});
