import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProperty extends Document {
  userId: Types.ObjectId;
  title: string;
  propertyType: "apartment" | "house" | "villa";
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  area: number;
  areaUnit: "sqft" | "sqm" | "marla" | "kanal";
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    propertyType: { type: String, enum: ["apartment", "house", "villa"], required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    area: { type: Number, required: true },
    areaUnit: { type: String, enum: ["sqft", "sqm", "marla", "kanal"], required: true },
    totalRooms: { type: Number, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    kitchens: { type: Number, required: true },
    description: { type: String, required: true },
    images: {
      type: [String],
      validate: [(arr) => arr.length <= 15, "Maximum 15 images allowed"],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PropertySchema.index({ userId: 1 });

export const Property = mongoose.model<IProperty>("Property", PropertySchema);
