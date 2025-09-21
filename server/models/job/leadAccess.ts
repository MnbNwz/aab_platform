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

// Index for efficient queries
LeadAccessSchema.index({ contractor: 1 });
LeadAccessSchema.index({ jobRequest: 1, contractor: 1 });

const LeadAccess = createModel<ILeadAccess>({
  schema: LeadAccessSchema,
  modelName: "LeadAccess",
});

export { LeadAccess };
export default LeadAccess;
