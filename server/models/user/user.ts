import { Schema } from "@models/types";
import {
  IUser,
  GeoHome,
  Contractor,
  ApprovalStatus,
  PropertyType,
  Customer,
} from "@models/types/user";
import { createModel } from "@models/utils/modelCreator";
import {
  USER_ROLES,
  USER_STATUSES,
  APPROVAL_STATUSES,
  PROPERTY_TYPES,
  STRIPE_CONNECT_STATUSES,
  DEFAULT_COOLDOWN_SECONDS,
} from "@models/constants";

const CustomerSchema = new Schema<Customer>(
  {
    defaultPropertyType: {
      type: String,
      enum: PROPERTY_TYPES,
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

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  status: {
    type: String,
    enum: USER_STATUSES,
    default: "pending",
  },
  geoHome: { type: GeoHomeSchema, required: true },
  customer: { type: CustomerSchema },
  contractor: { type: ContractorSchema },
  approval: {
    type: String,
    enum: APPROVAL_STATUSES,
    default: "pending",
  },
  profileImage: { type: String, required: false },
  // User verification object
  userVerification: {
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    lastSentAt: { type: Date, default: null },
    canResend: { type: Boolean, default: true },
    cooldownSeconds: { type: Number, default: DEFAULT_COOLDOWN_SECONDS },
  },
  // Password reset fields
  passwordReset: {
    token: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    lastRequestedAt: { type: Date, default: null },
  },
  // Stripe fields
  stripeCustomerId: { type: String },
  stripeConnectAccountId: { type: String },
  stripeConnectStatus: {
    type: String,
    enum: STRIPE_CONNECT_STATUSES,
    default: "pending",
  },
  // Favorites (customers only - max 10 contractors)
  favoriteContractors: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
    validate: [
      {
        validator: function (this: any, v: any[]) {
          // Only customers can have favorites
          if (this.role !== "customer" && v && v.length > 0) {
            return false;
          }
          return true;
        },
        message: "Only customers can have favorite contractors",
      },
      {
        validator: function (v: any[]) {
          // Max 10 favorites
          return v.length <= 10;
        },
        message: "Cannot have more than 10 favorite contractors",
      },
    ],
  },
});

// Create indexes for better query performance
// Note: email index is automatically created by unique: true
UserSchema.index({ geoHome: "2dsphere" }); // Geospatial index for contractor location queries
UserSchema.index({ favoriteContractors: 1 }); // Index for favorites queries (who favorited whom)

export const User = createModel<IUser>({
  schema: UserSchema,
  modelName: "User",
});
