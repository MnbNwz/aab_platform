import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { ILeadAccess } from "@models/types/job";
import { MEMBERSHIP_TIERS } from "@models/constants";

// This model tracks when contractors BID on jobs (consuming leads)
// Lead is consumed when bidding, not when accessing job details
const LeadAccessSchema = new Schema<ILeadAccess>({
  contractor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  jobRequest: { type: Schema.Types.ObjectId, ref: "JobRequest", required: true },
  bid: { type: Schema.Types.ObjectId, ref: "Bid", required: true }, // Reference to the bid
  accessedAt: { type: Date, default: Date.now }, // When bid was placed (lead consumed)
  membershipTier: {
    type: String,
    enum: MEMBERSHIP_TIERS,
    required: true,
  },
});

// OPTIMIZATION: Enhanced indexes for better performance
LeadAccessSchema.index({ contractor: 1 }); // For user queries
LeadAccessSchema.index({ jobRequest: 1, contractor: 1 }); // For duplicate bid checks
LeadAccessSchema.index({ contractor: 1, accessedAt: 1 }); // For monthly count queries
LeadAccessSchema.index({ accessedAt: 1 }); // For time-based queries
LeadAccessSchema.index({ bid: 1 }); // For bid lookup

const LeadAccess = createModel<ILeadAccess>({
  schema: LeadAccessSchema,
  modelName: "LeadAccess",
});

export { LeadAccess };
export default LeadAccess;
