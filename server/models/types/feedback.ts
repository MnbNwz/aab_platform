import { Document, Types } from "./mongoose";

export type FeedbackRole = "customer" | "contractor" | "admin";

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  jobRequest: Types.ObjectId;
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  fromRole: FeedbackRole;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
