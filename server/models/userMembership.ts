import mongoose, { Schema, Document } from "mongoose";

export interface IUserMembership extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  status: "active" | "expired" | "canceled";
  billingPeriod: "monthly" | "yearly"; // Which billing option user chose
  billingType: "recurring" | "one_time"; // Add this field to record user's billing type
  startDate: Date;
  endDate: Date;
  isAutoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
      enum: ["active", "expired", "canceled"],
      default: "active",
    },
    billingPeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    billingType: {
      type: String,
      enum: ["recurring", "one_time"],
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

export const UserMembership = mongoose.model<IUserMembership>(
  "UserMembership",
  UserMembershipSchema,
);
