import { Schema, model, Types } from "mongoose";

const JobRequestSchema = new Schema({
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, // admin, customer, etc.
  property: { type: Types.ObjectId, ref: "Property", required: true }, // property/job location
  title: { type: String, required: true },
  description: { type: String, required: true },
  service: { type: String, required: true }, // service from available services
  estimate: { type: Number, required: true }, // estimated cost
  type: { type: String, enum: ["regular", "off_market", "commercial"], default: "regular" },
  status: {
    type: String,
    enum: ["open", "inprogress", "hold", "completed", "cancelled"],
    default: "open",
  },
  bids: [{ type: Types.ObjectId, ref: "Bid" }],
  acceptedBid: { type: Types.ObjectId, ref: "Bid" },
  paymentStatus: {
    type: String,
    enum: ["pending", "deposit_paid", "prestart_paid", "completed", "refunded"],
    default: "pending",
  },
  timeline: { type: Number, required: true }, // timeline in days (e.g., 7, 14, 30)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const JobRequest = model("JobRequest", JobRequestSchema);
export { JobRequest };
export default JobRequest;
