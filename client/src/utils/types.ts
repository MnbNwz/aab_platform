// Consolidated type definitions for utility functions

// Badge types
export interface BadgeConfig {
  className: string;
  label: string;
  borderClassName?: string;
}

export type SuccessStatus =
  | "completed"
  | "accepted"
  | "succeeded"
  | "active"
  | "available"
  | "approved";

export type WarningStatus = "pending" | "under_offer";

export type DangerStatus = "rejected" | "failed" | "cancelled" | "revoke";

export type InfoStatus = "open";

export type NeutralStatus = "sold" | "inactive";

// Profile form data types
export interface ProfileFormDataParams {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  geoHome?: {
    type: "Point";
    coordinates: [number, number];
  };
  customer?: {
    defaultPropertyType: "domestic" | "commercial";
  };
  contractor?: {
    companyName: string;
    services: string[];
    license: string;
    taxId: string;
    docs: Array<{ type: string; url: string }>;
  };
  profileImageFile?: File;
}

// Image compression types
export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
  quality: number;
}

export interface CompressionResult {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}
