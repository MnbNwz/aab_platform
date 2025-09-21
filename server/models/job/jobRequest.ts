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
    },
  ],
});

const JobRequest = createModel<IJobRequest>({
  schema: JobRequestSchema,
  modelName: "JobRequest",
});

export { JobRequest };
export default JobRequest;
