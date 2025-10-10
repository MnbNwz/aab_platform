// Investment Opportunity type definitions
import { Document, Types } from "./mongoose";

export interface IInvestmentLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface IInvestmentPhoto {
  url: string;
  caption?: string;
}

export interface IInvestmentDocument {
  url: string;
  name: string;
  type: string; // pdf, docx, xlsx, etc.
}

export interface IContractorInterest {
  contractorId: Types.ObjectId;
  expressedAt: Date;
  message?: string;
  adminNotes?: string;
  status: "pending" | "accepted" | "rejected";
  contactStatus: "pending" | "accepted" | "rejected";
}

export interface IInvestmentOpportunity extends Document {
  _id: Types.ObjectId;

  // Basic Info
  title: string;
  propertyType: "house" | "duplex" | "triplex" | "sixplex" | "land" | "commercial";
  location: IInvestmentLocation;

  // Financial
  askingPrice: number;
  projectedROI?: number; // percentage

  // Property Details
  description: string;
  lotSize?: string;
  buildingSize?: string;
  numberOfUnits?: number;
  yearBuilt?: number;

  // Renovation
  renovationNeeded: boolean;
  estimatedRenovationCost?: number;
  estimatedCompletionTime?: number; // in months
  renovationDetails?: string;

  // Investment Highlights
  highlights: string[];

  // Media
  photos: IInvestmentPhoto[];
  documents: IInvestmentDocument[];

  // Status
  status: "available" | "under_offer" | "sold";

  // Interests
  interests: IContractorInterest[];

  // Metadata
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
