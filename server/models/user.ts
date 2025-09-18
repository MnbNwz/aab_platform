import mongoose, { Schema } from "mongoose";
import {
  IUser,
  GeoHome,
  Contractor,
  ApprovalStatus,
  PropertyType,
  Customer,
} from "@models/types/user";

const CustomerSchema = new Schema<Customer>(
  {
    defaultPropertyType: {
      type: String,
      enum: ["domestic", "commercial"],
      default: "domestic",
      required: true,
    },
  },
  { _id: false },
);

const GeoHomeSchema = new Schema<GeoHome>({
  type: { type: String, enum: ["Point"], required: true },
  coordinates: { type: [Number], required: true },
});

const ContractorSchema = new Schema<Contractor>({
  companyName: { type: String, required: true },
  services: [{ type: String, required: true }],
  license: { type: String, required: true },
  taxId: { type: String, required: true },
  docs: { type: [Object], required: true },
});

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ["admin", "customer", "contractor"], required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "revoke"],
      default: "pending",
    },
    geoHome: { type: GeoHomeSchema, required: true },
    customer: { type: CustomerSchema },
    contractor: { type: ContractorSchema },
    approval: {
      type: String,
      enum: ["pending", "approved", "rejected"] as ApprovalStatus[],
      default: "pending" as ApprovalStatus,
    },
    profileImage: { type: String, required: false },
    // Stripe fields
    stripeCustomerId: { type: String },
    stripeConnectAccountId: { type: String },
    stripeConnectStatus: {
      type: String,
      enum: ["pending", "active", "rejected", "disabled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);
