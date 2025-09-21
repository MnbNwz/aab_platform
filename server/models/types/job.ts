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
  createdAt: Date;
  updatedAt: Date;
}

// Lead Access types
export interface ILeadAccess extends Document {
  _id: Types.ObjectId;
  contractor: Types.ObjectId;
  jobRequest: Types.ObjectId;
  accessedAt: Date;
  membershipTier: "basic" | "standard" | "premium";
  createdAt: Date;
  updatedAt: Date;
}
