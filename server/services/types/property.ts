import { Types } from "@models/types";

// Interface for property creation input
export interface PropertyInput {
  userId: Types.ObjectId;
  body: any;
  files?: any[];
}
