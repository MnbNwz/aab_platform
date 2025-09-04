import mongoose, { Schema, Document } from "mongoose";

export interface IContractorServices extends Document {
  _id: string;
  services: string[];
  version: number;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContractorServicesSchema = new Schema<IContractorServices>(
  {
    services: [{
      type: String,
      required: true,
      trim: true,
    }],
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
ContractorServicesSchema.index({ version: -1 });
ContractorServicesSchema.index({ createdAt: -1 });

export const ContractorServices = mongoose.model<IContractorServices>("ContractorServices", ContractorServicesSchema);
