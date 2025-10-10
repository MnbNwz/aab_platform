import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IInvestmentOpportunity } from "@models/types/investment";
import {
  INVESTMENT_PROPERTY_TYPES,
  INVESTMENT_STATUSES,
  INTEREST_STATUSES,
  INTEREST_CONTACT_STATUSES,
} from "@models/constants";

const InvestmentOpportunitySchema = new Schema<IInvestmentOpportunity>(
  {
    // Basic Info
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    propertyType: {
      type: String,
      enum: INVESTMENT_PROPERTY_TYPES,
      required: [true, "Property type is required"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
        validate: {
          validator: function (v: number[]) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 && // longitude
              v[1] >= -90 &&
              v[1] <= 90 // latitude
            );
          },
          message: "Invalid coordinates. Must be [longitude, latitude]",
        },
      },
    },

    // Financial
    askingPrice: {
      type: Number,
      required: [true, "Asking price is required"],
      min: [0, "Asking price must be positive"],
    },
    projectedROI: {
      type: Number,
      min: [0, "ROI must be positive"],
    },

    // Property Details
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    lotSize: { type: String },
    buildingSize: { type: String },
    numberOfUnits: {
      type: Number,
      min: [0, "Number of units must be positive"],
    },
    yearBuilt: {
      type: Number,
      min: [1800, "Year built seems invalid"],
      max: [new Date().getFullYear() + 1, "Year built cannot be in the future"],
    },

    // Renovation
    renovationNeeded: {
      type: Boolean,
      default: false,
    },
    estimatedRenovationCost: {
      type: Number,
      min: [0, "Renovation cost must be positive"],
    },
    estimatedCompletionTime: {
      type: Number,
      min: [0, "Completion time must be positive"],
    },
    renovationDetails: { type: String },

    // Investment Highlights
    highlights: {
      type: [String],
      default: [],
    },

    // Media
    photos: {
      type: [
        {
          url: { type: String, required: true },
          caption: { type: String },
        },
      ],
      default: [],
      validate: {
        validator: function (v: any[]) {
          return v.length <= 10;
        },
        message: "Maximum 10 photos allowed",
      },
    },
    documents: {
      type: [
        {
          url: { type: String, required: true },
          name: { type: String, required: true },
          type: { type: String, required: true },
        },
      ],
      default: [],
      validate: {
        validator: function (v: any[]) {
          return v.length <= 5;
        },
        message: "Maximum 5 documents allowed",
      },
    },

    // Status
    status: {
      type: String,
      enum: INVESTMENT_STATUSES,
      default: "available",
    },

    // Interests
    interests: {
      type: [
        {
          contractorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          expressedAt: {
            type: Date,
            default: Date.now,
          },
          message: { type: String },
          adminNotes: { type: String },
          status: {
            type: String,
            enum: INTEREST_STATUSES,
            default: "pending",
          },
          contactStatus: {
            type: String,
            enum: INTEREST_CONTACT_STATUSES,
            default: "pending",
          },
        },
      ],
      default: [],
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound Indexes for better query performance
// Most common query pattern: filter by status + sort by date
InvestmentOpportunitySchema.index({ status: 1, createdAt: -1 });

// Filter by property type + status + sort by date
InvestmentOpportunitySchema.index({ propertyType: 1, status: 1, createdAt: -1 });

// Geospatial index for location-based queries
InvestmentOpportunitySchema.index({ location: "2dsphere" });

// Price range queries + status
InvestmentOpportunitySchema.index({ askingPrice: 1, status: 1 });

// Contractor interest lookups
InvestmentOpportunitySchema.index({ "interests.contractorId": 1, status: 1 });

// Text search index for title and description
InvestmentOpportunitySchema.index({
  title: "text",
  description: "text",
  "location.city": "text",
  "location.province": "text",
  "location.fullAddress": "text",
});

export const InvestmentOpportunity = createModel<IInvestmentOpportunity>({
  schema: InvestmentOpportunitySchema,
  modelName: "InvestmentOpportunity",
});
