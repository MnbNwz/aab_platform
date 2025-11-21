// System-related type definitions
import { Document, Types } from "./mongoose";

export interface IContractorServices extends Document {
  _id: Types.ObjectId;
  services: string[];
  version: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContractorServicesExtended extends Document {
  _id: Types.ObjectId;
  name: string; // Scope
  materialUnit?: number; // Material ur
  laborUnit?: number; // Labor unit
  comment?: string; // Comment/
  createdAt: Date;
  updatedAt: Date;
}
