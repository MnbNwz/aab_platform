import mongoose, { Schema, Document } from "mongoose";

export interface IMembershipPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  userType: "customer" | "contractor";
  tier: "basic" | "standard" | "premium";
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  annualDiscountRate: number; // discount percentage for annual billing
  duration: number; // in days
  stripeProductId?: string; // Stripe product ID
  stripePriceIdMonthly?: string; // Stripe price ID for monthly
  stripePriceIdYearly?: string; // Stripe price ID for yearly
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
    monthlyPrice: { type: Number, required: true },
    yearlyPrice: { type: Number, required: true },
    annualDiscountRate: { type: Number, default: 15 }, // 15% discount
    duration: { type: Number, required: true, default: 30 }, // 30 days default
    stripeProductId: { type: String },
    stripePriceIdMonthly: { type: String },
    stripePriceIdYearly: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MembershipPlan = mongoose.model<IMembershipPlan>("MembershipPlan", MembershipPlanSchema);
