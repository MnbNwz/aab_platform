import { Types } from "mongoose";

// Interface for property creation input
export interface PropertyInput {
  userId: Types.ObjectId;
  body: any;
  files?: any[];
}
