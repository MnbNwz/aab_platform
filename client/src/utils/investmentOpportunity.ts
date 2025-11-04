import type {
  InvestmentPropertyType,
  InvestmentStatus,
  ContactStatus,
} from "../types";
import { Building2, Home, MapPin } from "lucide-react";
import {
  getInvestmentStatusBadge as getInvestmentStatusBadgeUtil,
  getContactStatusBadge as getContactStatusBadgeUtil,
  formatJobStatusText,
} from "./badgeColors";

// Format price from cents to currency string
export const formatInvestmentPrice = (priceInCents: number): string => {
  return `$${(priceInCents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Get status badge styling
export const getInvestmentStatusBadge = (status: InvestmentStatus) => {
  return {
    className: getInvestmentStatusBadgeUtil(status),
    label: formatJobStatusText(status.replace("_", " ")),
  };
};

// Get contact status badge styling
export const getContactStatusBadge = (status: ContactStatus) => {
  return {
    className: getContactStatusBadgeUtil(status),
    label: formatJobStatusText(status),
  };
};

// Get property type icon component
export const getPropertyTypeIcon = (type: InvestmentPropertyType) => {
  const icons: Record<InvestmentPropertyType, typeof Building2> = {
    house: Home,
    duplex: Building2,
    triplex: Building2,
    sixplex: Building2,
    land: MapPin,
    commercial: Building2,
  };
  return icons[type] || Building2;
};

// Canadian provinces list
export const CANADIAN_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

// Validate investment opportunity form data
export const validateInvestmentOpportunityForm = (
  formData: any,
  highlights: string[],
  hasAttachments: boolean
): { valid: boolean; error?: string } => {
  // Basic Information
  if (!formData.title?.trim()) {
    return { valid: false, error: "Title is required" };
  }
  if (!formData.propertyType) {
    return { valid: false, error: "Property Type is required" };
  }
  if (!formData.askingPrice || Number(formData.askingPrice) <= 0) {
    return { valid: false, error: "Valid Asking Price is required" };
  }
  if (!formData.projectedROI || Number(formData.projectedROI) <= 0) {
    return { valid: false, error: "Projected ROI is required" };
  }

  // Description
  if (!formData.description?.trim()) {
    return { valid: false, error: "Description is required" };
  }

  // Location (coordinates)
  if (
    !formData.location ||
    !Array.isArray(formData.location) ||
    formData.location.length !== 2
  ) {
    return { valid: false, error: "Location coordinates are required" };
  }
  if (formData.location[0] === 0 && formData.location[1] === 0) {
    return { valid: false, error: "Please select a location on the map" };
  }

  // Property Details
  if (!formData.lotSize?.trim()) {
    return { valid: false, error: "Lot Size is required" };
  }
  if (!formData.buildingSize?.trim()) {
    return { valid: false, error: "Building Size is required" };
  }
  if (!formData.numberOfUnits || Number(formData.numberOfUnits) <= 0) {
    return { valid: false, error: "Number of Units is required" };
  }
  if (!formData.yearBuilt || Number(formData.yearBuilt) <= 0) {
    return { valid: false, error: "Year Built is required" };
  }

  // Highlights
  const validHighlights = highlights.filter((h) => h.trim() !== "");
  if (validHighlights.length === 0) {
    return { valid: false, error: "At least one highlight is required" };
  }

  // Attachments
  if (!hasAttachments) {
    return {
      valid: false,
      error: "At least one attachment (photo or document) is required",
    };
  }

  return { valid: true };
};

// Build FormData for investment opportunity (with file uploads)
export const buildInvestmentOpportunityFormData = (
  formData: any,
  highlights: string[],
  attachmentFiles: File[],
  attachmentNames: string[],
  attachmentTypes: string[],
  existingAttachments?: Array<{ url: string; name: string; type: string }>
): FormData => {
  const formDataObj = new FormData();

  // Basic fields
  formDataObj.append("title", formData.title.trim());
  formDataObj.append("propertyType", formData.propertyType);
  formDataObj.append(
    "location",
    JSON.stringify({
      type: "Point",
      coordinates: formData.location, // [longitude, latitude]
    })
  );
  formDataObj.append(
    "askingPrice",
    String(Math.round(Number(formData.askingPrice) * 100))
  );
  formDataObj.append("description", formData.description.trim());

  // Optional fields
  if (formData.projectedROI) {
    formDataObj.append("projectedROI", String(Number(formData.projectedROI)));
  }
  if (formData.lotSize) formDataObj.append("lotSize", formData.lotSize.trim());
  if (formData.buildingSize)
    formDataObj.append("buildingSize", formData.buildingSize.trim());
  if (formData.numberOfUnits)
    formDataObj.append("numberOfUnits", String(Number(formData.numberOfUnits)));
  if (formData.yearBuilt)
    formDataObj.append("yearBuilt", String(Number(formData.yearBuilt)));

  // Renovation details
  formDataObj.append("renovationNeeded", String(formData.renovationNeeded));
  if (formData.renovationNeeded) {
    if (formData.estimatedRenovationCost) {
      formDataObj.append(
        "estimatedRenovationCost",
        String(Math.round(Number(formData.estimatedRenovationCost) * 100))
      );
    }
    if (formData.estimatedCompletionTime) {
      formDataObj.append(
        "estimatedCompletionTime",
        String(Number(formData.estimatedCompletionTime))
      );
    }
    if (formData.renovationDetails) {
      formDataObj.append(
        "renovationDetails",
        formData.renovationDetails.trim()
      );
    }
  }

  // Highlights
  const filteredHighlights = highlights.filter((h) => h.trim() !== "");
  if (filteredHighlights.length > 0) {
    formDataObj.append("highlights", JSON.stringify(filteredHighlights));
  }

  // Existing attachments (for updates)
  if (existingAttachments && existingAttachments.length > 0) {
    formDataObj.append(
      "existingAttachments",
      JSON.stringify(existingAttachments)
    );
  }

  // Separate files into photos and documents
  let photoIndex = 0;
  let documentIndex = 0;

  attachmentFiles.forEach((file, index) => {
    const isImage = file.type.startsWith("image/");

    if (isImage) {
      // Add to photos field
      formDataObj.append("photos", file);
      // Optional caption for photos
      if (attachmentNames[index]) {
        formDataObj.append(
          `photoCaption_${photoIndex}`,
          attachmentNames[index]
        );
      }
      photoIndex++;
    } else {
      // Add to documents field
      formDataObj.append("documents", file);
      // Required metadata for documents
      formDataObj.append(
        `documentName_${documentIndex}`,
        attachmentNames[index] || file.name
      );
      formDataObj.append(
        `documentType_${documentIndex}`,
        attachmentTypes[index] || getFileExtension(file)
      );
      documentIndex++;
    }
  });

  return formDataObj;
};

// Helper function to get file extension from file
const getFileExtension = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  // Map common MIME types to extensions
  if (file.type === "application/pdf") return "pdf";
  if (file.type.includes("word")) return "doc";
  if (file.type.includes("excel") || file.type.includes("spreadsheet"))
    return "xlsx";
  return extension || "file";
};

// Validate file before upload
export const validateFile = (
  file: File,
  type: "photo" | "document"
): { valid: boolean; error?: string } => {
  const maxPhotoSize = 5 * 1024 * 1024; // 5MB
  const maxDocumentSize = 10 * 1024 * 1024; // 10MB

  const allowedPhotoTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  const allowedDocumentTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (type === "photo") {
    if (!allowedPhotoTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Only JPEG, PNG, and WebP images are allowed for photos",
      };
    }
    if (file.size > maxPhotoSize) {
      return { valid: false, error: "Photo size must be less than 5MB" };
    }
  } else {
    if (!allowedDocumentTypes.includes(file.type)) {
      return { valid: false, error: "File type not allowed" };
    }
    if (file.size > maxDocumentSize) {
      return { valid: false, error: "Document size must be less than 10MB" };
    }
  }

  return { valid: true };
};
