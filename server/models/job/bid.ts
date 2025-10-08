import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IBid } from "@models/types/job";
import { BID_STATUSES } from "@models/constants";

const BidSchema = new Schema<IBid>({
  jobRequest: { type: Schema.Types.ObjectId, ref: "JobRequest", required: true },
  contractor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bidAmount: { type: Number, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: BID_STATUSES,
    default: "pending",
  },
  timeline: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  materials: {
    included: { type: Boolean, default: false },
    description: { type: String },
  },
  warranty: {
    period: { type: Number, required: false }, // in months
    description: { type: String, required: false },
  },
});

// PERFORMANCE INDEX for contractor bid queries
BidSchema.index({ contractor: 1, updatedAt: -1 }); // For sorting contractor's bids by most recent

const Bid = createModel<IBid>({
  schema: BidSchema,
  modelName: "Bid",
});

export { Bid };
export default Bid;
