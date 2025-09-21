import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IContractorServices } from "@models/types/system";
import { DEFAULT_SERVICE_VERSION } from "@models/constants";

const ContractorServicesSchema = new Schema<IContractorServices>(
  {
    services: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    version: {
      type: Number,
      required: true,
      default: DEFAULT_SERVICE_VERSION,
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
  { timestamps: true },
);

// Indexes for better performance
ContractorServicesSchema.index({ version: -1 });
ContractorServicesSchema.index({ createdAt: -1 });

export const ContractorServices = createModel<IContractorServices>({
  schema: ContractorServicesSchema,
  modelName: "ContractorServices",
});
