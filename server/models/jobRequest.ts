import { Schema, model, Types } from "mongoose";

const JobRequestSchema = new Schema({
  createdBy: { type: Types.ObjectId, ref: "User", required: true }, // admin, customer, etc.
  property: { type: Types.ObjectId, ref: "Property" }, // property/job location (optional for off-market)
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String }, // e.g., painting, plumbing, etc.
  budget: { type: Number },
  type: { type: String, enum: ["regular", "off_market"], default: "regular" },
  status: {
    type: String,
    enum: [
      "open",
      "approved",
      "in_progress",
      "hold",
      "completed",
      "cancelled"
    ],
    default: "open"
  },
  bids: [{ type: Types.ObjectId, ref: "Bid" }],
  acceptedBid: { type: Types.ObjectId, ref: "Bid" },
  assignedContractor: { type: Types.ObjectId, ref: "User" },
  paymentStatus: {
    type: String,
    enum: ["pending", "deposit_paid", "prestart_paid", "completed", "refunded"],
    default: "pending"
  },
  images: {
    type: [String],
    validate: [arr => arr.length <= 5, 'Maximum 5 images allowed'],
    default: []
  },
  timeline: [
    {
      status: String,
      date: Date,
      by: { type: Types.ObjectId, ref: "User" }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default model("JobRequest", JobRequestSchema);
