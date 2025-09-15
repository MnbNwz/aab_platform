import { Schema, model, Types } from "mongoose";

const BidSchema = new Schema({
  jobRequest: { type: Types.ObjectId, ref: "JobRequest", required: true },
  contractor: { type: Types.ObjectId, ref: "User", required: true },
  bidAmount: { type: Number, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Bid = model("Bid", BidSchema);
export { Bid };
export default Bid;
