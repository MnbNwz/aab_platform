import mongoose, { Schema, Document } from "mongoose";

export interface IOffMarketPayment extends Document {
  _id: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  contractorId: mongoose.Types.ObjectId;
  
  // Payment amounts (in cents)
  listingPrice: number;
  depositAmount: number; // Usually 10% of listing price
  financingAmount?: number; // If contractor uses AAS financing
  
  // Payment status
  status: "pending" | "deposit_paid" | "financing_approved" | "completed" | "cancelled" | "refunded";
  
  // Stripe payment intents
  depositPaymentIntentId?: string;
  financingPaymentIntentId?: string;
  
  // Financing details
  financing: {
    isRequested: boolean;
    isApproved: boolean;
    approvedAmount?: number;
    termSheet?: string; // URL to term sheet document
    underwritingStatus?: "pending" | "approved" | "rejected";
    interestRate?: number;
    termMonths?: number;
  };
  
  // Legal and escrow
  legalDocs: {
    purchaseAgreement?: string;
    titleDeed?: string;
    otherDocs: string[];
  };
  
  escrowAccountId?: string;
  escrowStatus?: "pending" | "funded" | "released" | "cancelled";
  
  // Payment dates
  depositPaidAt?: Date;
  financingApprovedAt?: Date;
  completionDate?: Date;
  
  // Refund information
  refunds: {
    amount: number;
    reason: string;
    stripeRefundId: string;
    processedAt: Date;
    adminFee: number;
    stripeFee: number;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const OffMarketPaymentSchema: Schema<IOffMarketPayment> = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "OffMarketListing",
      required: true,
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingPrice: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    financingAmount: { type: Number },
    status: {
      type: String,
      enum: ["pending", "deposit_paid", "financing_approved", "completed", "cancelled", "refunded"],
      default: "pending",
    },
    depositPaymentIntentId: { type: String },
    financingPaymentIntentId: { type: String },
    financing: {
      isRequested: { type: Boolean, default: false },
      isApproved: { type: Boolean, default: false },
      approvedAmount: { type: Number },
      termSheet: { type: String },
      underwritingStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      interestRate: { type: Number },
      termMonths: { type: Number },
    },
    legalDocs: {
      purchaseAgreement: { type: String },
      titleDeed: { type: String },
      otherDocs: [{ type: String }],
    },
    escrowAccountId: { type: String },
    escrowStatus: {
      type: String,
      enum: ["pending", "funded", "released", "cancelled"],
      default: "pending",
    },
    depositPaidAt: { type: Date },
    financingApprovedAt: { type: Date },
    completionDate: { type: Date },
    refunds: [{
      amount: { type: Number, required: true },
      reason: { type: String, required: true },
      stripeRefundId: { type: String, required: true },
      processedAt: { type: Date, required: true },
      adminFee: { type: Number, required: true },
      stripeFee: { type: Number, required: true },
    }],
  },
  { timestamps: true }
);

// Indexes for efficient queries
OffMarketPaymentSchema.index({ listingId: 1 });
OffMarketPaymentSchema.index({ contractorId: 1, status: 1 });

export const OffMarketPayment = mongoose.model<IOffMarketPayment>("OffMarketPayment", OffMarketPaymentSchema);
