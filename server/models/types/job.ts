// Job-related type definitions
import { Document, Types } from "./mongoose";

export interface ITimeline {
  startDate: Date;
  endDate: Date;
}

export interface IMaterials {
  included: boolean;
  description?: string;
}

export interface IWarranty {
  period?: number; // in months
  description?: string;
}

export interface ITimelineHistory {
  status: string;
  date: Date;
  by: Types.ObjectId;
  description?: string;
}

// Bid types
export interface IBid extends Document {
  _id: Types.ObjectId;
  jobRequest: Types.ObjectId;
  contractor: Types.ObjectId;
  bidAmount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  timeline: ITimeline;
  materials: IMaterials;
  warranty: IWarranty;
  // Deposit payment fields
  depositPaid?: boolean;
  depositAmount?: number;
  depositPaymentId?: Types.ObjectId;
  depositPaidAt?: Date;
  // Completion payment fields
  completionPaid?: boolean;
  completionAmount?: number;
  completionPaymentId?: Types.ObjectId;
  completionPaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Job Request types
export interface IJobRequest extends Document {
  _id: Types.ObjectId;
  createdBy: Types.ObjectId;
  property: Types.ObjectId;
  title: string;
  description: string;
  service: string;
  estimate: number;
  type: "regular" | "off_market" | "commercial";
  status: "open" | "inprogress" | "hold" | "completed" | "cancelled";
  bids: Types.ObjectId[];
  acceptedBid?: Types.ObjectId;
  paymentStatus: "pending" | "deposit_paid" | "prestart_paid" | "completed" | "refunded";
  timeline: number; // timeline in days
  timelineHistory: ITimelineHistory[];
  // Deposit payment fields
  depositPaid?: boolean;
  depositAmount?: number;
  // Completion payment fields
  completionPaid?: boolean;
  completionAmount?: number;
  completionPaymentId?: Types.ObjectId;
  completionPaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Lead Access types - tracks when contractors bid on jobs (consuming leads)
export interface ILeadAccess extends Document {
  _id: Types.ObjectId;
  contractor: Types.ObjectId;
  jobRequest: Types.ObjectId;
  bid: Types.ObjectId; // Reference to the bid that consumed the lead
  accessedAt: Date; // When bid was placed (lead consumed)
  membershipTier: "basic" | "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
}
