import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { ILeadAccess } from "@models/types/job";
import { MEMBERSHIP_TIERS } from "@models/constants";

const LeadAccessSchema = new Schema<ILeadAccess>({
  contractor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobRequest: { type: Schema.Types.ObjectId, ref: "JobRequest", required: true },
  accessedAt: { type: Date, default: Date.now },
  membershipTier: {
    type: String,
    enum: MEMBERSHIP_TIERS,
    required: true,
  },
});

// OPTIMIZATION 6: Enhanced indexes for better performance
LeadAccessSchema.index({ contractor: 1 }); // For user queries
LeadAccessSchema.index({ jobRequest: 1, contractor: 1 }); // For duplicate access checks
LeadAccessSchema.index({ contractor: 1, accessedAt: 1 }); // For monthly count queries
LeadAccessSchema.index({ accessedAt: 1 }); // For time-based queries

const LeadAccess = createModel<ILeadAccess>({
  schema: LeadAccessSchema,
  modelName: "LeadAccess",
});

export { LeadAccess };
export default LeadAccess;
