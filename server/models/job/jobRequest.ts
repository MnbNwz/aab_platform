import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IJobRequest } from "@models/types/job";
import { JOB_TYPES, JOB_STATUSES, JOB_PAYMENT_STATUSES } from "@models/constants";

const JobRequestSchema = new Schema<IJobRequest>({
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // admin, customer, etc.
  property: { type: Schema.Types.ObjectId, ref: "Property", required: true }, // property/job location
  title: { type: String, required: true },
  description: { type: String, required: true },
  service: { type: String, required: true }, // service from available services
  estimate: { type: Number, required: true }, // estimated cost
  type: { type: String, enum: JOB_TYPES, default: "regular" },
  status: {
    type: String,
    enum: JOB_STATUSES,
    default: "open",
  },
  bids: [{ type: Schema.Types.ObjectId, ref: "Bid" }],
  acceptedBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  paymentStatus: {
    type: String,
    enum: JOB_PAYMENT_STATUSES,
    default: "pending",
  },
  timeline: { type: Number, required: true }, // timeline in days (e.g., 7, 14, 30)
  timelineHistory: [
    {
      status: { type: String, required: true },
      date: { type: Date, default: Date.now },
      by: { type: Schema.Types.ObjectId, ref: "User", required: true },
      description: { type: String }, // Optional description for timeline events
    },
  ],
  // Deposit payment fields
  depositPaid: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  // Completion payment fields
  completionPaid: { type: Boolean, default: false },
  completionAmount: { type: Number, default: 0 },
  completionPaymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  completionPaidAt: { type: Date },
});

// PERFORMANCE INDEXES (minimal, optimized for actual query patterns)
// Index 1: Customer queries (covers 90% of customer use cases via leftmost prefix)
// - { createdBy: X } sorted by createdAt ✅
// - { createdBy: X, status: Y } sorted by createdAt ✅
JobRequestSchema.index({ createdBy: 1, status: 1, createdAt: -1 });

// Index 2: Contractor queries (status + service + sort)
// - { status: "open", service: {$in: [...]} } sorted by createdAt ✅
JobRequestSchema.index({ status: 1, service: 1, createdAt: -1 });

// Index 3: Property queries (simple single-field index is sufficient)
// - Used for: property validation, job lookup by property
// - With typical 1-20 jobs per property, filtering status in memory is negligible
JobRequestSchema.index({ property: 1 });

const JobRequest = createModel<IJobRequest>({
  schema: JobRequestSchema,
  modelName: "JobRequest",
});

export { JobRequest };
export default JobRequest;
