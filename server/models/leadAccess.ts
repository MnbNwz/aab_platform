import { Schema, model, Types } from "mongoose";

const LeadAccessSchema = new Schema({
  contractor: { type: Types.ObjectId, ref: "User", required: true },
  jobRequest: { type: Types.ObjectId, ref: "JobRequest", required: true },
  accessedAt: { type: Date, default: Date.now },
  membershipTier: {
    type: String,
    enum: ["basic", "standard", "premium"],
    required: true,
  },
  leadCost: { type: Number, default: 1 }, // 1 lead per access
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient queries
LeadAccessSchema.index({ contractor: 1, month: 1, year: 1 });
LeadAccessSchema.index({ jobRequest: 1, contractor: 1 });

const LeadAccess = model("LeadAccess", LeadAccessSchema);
export { LeadAccess };
export default LeadAccess;
