import mongoose, { Schema } from "mongoose";
import {
  IUser,
  Customer,
  Insurance,
  PortfolioItem,
  GeoHome,
  Approval,
  Contractor,
  UserRole,
  UserStatus,
  PropertyType,
  ApprovalStatus,
} from "./types/user";

const CustomerSchema = new Schema<Customer>({
  defaultPropertyType: { type: String, enum: ["domestic", "commercial"], required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
});

const InsuranceSchema = new Schema<Insurance>({
  provider: { type: String, required: true },
  policyNo: { type: String, required: true },
  validTill: { type: Date, required: true },
});

const PortfolioItemSchema = new Schema<PortfolioItem>({
  title: { type: String, required: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
});

const GeoHomeSchema = new Schema<GeoHome>({
  type: { type: String, enum: ["Point"], required: true },
  coordinates: { type: [Number], required: true },
});

const ApprovalSchema = new Schema<Approval>({
  status: { type: String, enum: ["pending", "approved", "rejected"], required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  note: { type: String },
});

const ContractorSchema = new Schema<Contractor>({
  companyName: { type: String, required: true },
  services: [{ type: String, enum: ["plumbing", "electrical"], required: true }],
  license: { type: String, required: true },
  taxId: { type: String, required: true },
  insurance: { type: InsuranceSchema, required: true },
  portfolio: [PortfolioItemSchema],
  geoHome: { type: GeoHomeSchema, required: true },
  radiusKm: { type: Number, required: true },
  featured: { type: Boolean, default: false },
  verifiedBadge: { type: Boolean, default: false },
  rank: { type: Number, default: 0 },
  subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
  approval: { type: ApprovalSchema, required: true },
});

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ["admin", "customer", "contractor"], required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
    customer: { type: CustomerSchema },
    contractor: { type: ContractorSchema },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);
