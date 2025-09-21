// Property-related type definitions
import { Document, Types } from "./mongoose";

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface IProperty extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  propertyType: "apartment" | "house" | "villa";
  location: ILocation;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  area: number;
  areaUnit: "sqft" | "sqm" | "marla" | "kanal";
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: string[]; // Array of image URLs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
