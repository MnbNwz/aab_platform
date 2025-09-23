import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IUserMembership } from "@models/types/membership";
import { MEMBERSHIP_STATUSES, BILLING_PERIODS, BILLING_TYPES } from "@models/constants";

// Re-export the interface
export { IUserMembership };

const UserMembershipSchema: Schema<IUserMembership> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: "active",
    },
    billingPeriod: {
      type: String,
      enum: BILLING_PERIODS,
      required: true,
    },
    billingType: {
      type: String,
      enum: BILLING_TYPES,
      required: true,
      default: "recurring",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isAutoRenew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index to quickly find active memberships
UserMembershipSchema.index({ userId: 1, status: 1 });
UserMembershipSchema.index({ endDate: 1, status: 1 });
UserMembershipSchema.index({ userId: 1, status: 1, endDate: 1 });

export const UserMembership = createModel<IUserMembership>({
  schema: UserMembershipSchema,
  modelName: "UserMembership",
});
