import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IJobPayment } from "@models/types/payment";
import { PAYMENT_STAGE_STATUSES, JOB_PAYMENT_STAGES, MILESTONE_STATUSES } from "@models/constants";

const JobPaymentSchema = new Schema<IJobPayment>({
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
    enum: PAYMENT_STAGE_STATUSES,
    default: "pending",
  },
  preStartStatus: {
    type: String,
    enum: PAYMENT_STAGE_STATUSES,
    default: "pending",
  },
  completionStatus: {
    type: String,
    enum: PAYMENT_STAGE_STATUSES,
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
    enum: JOB_PAYMENT_STAGES,
    default: "pending",
  },
  milestones: [
    {
      name: { type: String, required: true },
      status: {
        type: String,
        enum: MILESTONE_STATUSES,
        default: "pending",
      },
      completedAt: { type: Date },
    },
  ],
  metadata: { type: Schema.Types.Mixed },
});

// Indexes for efficient queries
JobPaymentSchema.index({ jobRequestId: 1 });
JobPaymentSchema.index({ customerId: 1 });
JobPaymentSchema.index({ contractorId: 1 });
JobPaymentSchema.index({ bidId: 1 });

export const JobPayment = createModel<IJobPayment>({
  schema: JobPaymentSchema,
  modelName: "JobPayment",
});
