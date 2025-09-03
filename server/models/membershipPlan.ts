import mongoose, { Schema, Document } from "mongoose";

export interface IMembershipPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  userType: "customer" | "contractor";
  tier: "basic" | "standard" | "premium";
  features: string[];
  price: number;
  duration: number; // in days
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipPlanSchema: Schema<IMembershipPlan> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    userType: {
      type: String,
      enum: ["customer", "contractor"],
      required: true,
    },
    tier: {
      type: String,
      enum: ["basic", "standard", "premium"],
      required: true,
    },
    features: [{ type: String }],
    price: { type: Number, required: true },
    duration: { type: Number, required: true, default: 30 }, // 30 days default
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MembershipPlan = mongoose.model<IMembershipPlan>("MembershipPlan", MembershipPlanSchema);
