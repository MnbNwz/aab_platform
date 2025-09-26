import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IProperty } from "@models/types/property";
import {
  PROPERTY_TYPE_OPTIONS,
  LOCATION_TYPES,
  AREA_UNITS,
  MAX_PROPERTY_IMAGES,
  VALIDATION_MESSAGES,
} from "@models/constants";

const PropertySchema = new Schema<IProperty>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  propertyType: { type: String, enum: PROPERTY_TYPE_OPTIONS, required: true },
  location: {
    type: {
      type: String,
      enum: LOCATION_TYPES,
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  area: { type: Number, required: true },
  areaUnit: { type: String, enum: AREA_UNITS, required: true },
  totalRooms: { type: Number, required: true },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  kitchens: { type: Number, required: true },
  description: { type: String, required: true },
  images: {
    type: [String],
    validate: [(arr) => arr.length <= MAX_PROPERTY_IMAGES, VALIDATION_MESSAGES.MAX_IMAGES_EXCEEDED],
    default: [],
  },
  isActive: { type: Boolean, default: true },
});

PropertySchema.index({ userId: 1 });
PropertySchema.index({ location: "2dsphere" });

export const Property = createModel<IProperty>({
  schema: PropertySchema,
  modelName: "Property",
});
