// Membership-related type definitions
import { Document, Types } from "./mongoose";

export interface IMembershipPlan extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  userType: "customer" | "contractor";
  tier: "basic" | "standard" | "premium";
  features: string[];
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  annualDiscountRate: number; // discount percentage for annual billing
  duration: number; // in days
  stripeProductId?: string; // Stripe product ID
  stripePriceIdMonthly?: string; // Stripe price ID for monthly
  stripePriceIdYearly?: string; // Stripe price ID for yearly
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMembership extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  paymentId: Types.ObjectId;
  status: "active" | "expired" | "canceled";
  billingPeriod: "monthly" | "yearly"; // Which billing option user chose
  billingType: "recurring" | "one_time"; // Add this field to record user's billing type
  startDate: Date;
  endDate: Date;
  isAutoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
