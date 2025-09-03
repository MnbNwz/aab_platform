import mongoose, { Schema, Document } from "mongoose";

export interface IUserMembership extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: "active" | "expired" | "canceled";
  startDate: Date;
  endDate: Date;
  isAutoRenew: boolean;
  purchasePrice: number;
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
    status: {
      type: String,
      enum: ["active", "expired", "canceled"],
      default: "active",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isAutoRenew: { type: Boolean, default: false },
    purchasePrice: { type: Number, required: true },
  },
  { timestamps: true }
);

// Index to quickly find active memberships
UserMembershipSchema.index({ userId: 1, status: 1 });
UserMembershipSchema.index({ endDate: 1, status: 1 });

export const UserMembership = mongoose.model<IUserMembership>("UserMembership", UserMembershipSchema);
