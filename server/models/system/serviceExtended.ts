import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IContractorServicesExtended } from "@models/types/system";

const ContractorServicesExtendedSchema = new Schema<IContractorServicesExtended>(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      unique: true,
      index: true,
    },
    materialUnit: {
      type: Number,
      required: false,
      min: [0, "Material unit must be positive"],
    },
    laborUnit: {
      type: Number,
      required: false,
      min: [0, "Labor unit must be positive"],
    },
    comment: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

// Indexes for better performance
ContractorServicesExtendedSchema.index({ name: 1 }); // Unique index already created above
ContractorServicesExtendedSchema.index({ createdAt: -1 });

export const ContractorServicesExtended = createModel<IContractorServicesExtended>({
  schema: ContractorServicesExtendedSchema,
  modelName: "ContractorServicesExtended",
});
