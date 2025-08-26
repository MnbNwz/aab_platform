import { Types, Document } from "mongoose";

export type UserRole = "admin" | "customer" | "contractor";
export type UserStatus = "pending" | "active" | "suspended";
export type PropertyType = "domestic" | "commercial";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Customer {
  defaultPropertyType: PropertyType;
  subscriptionId: Types.ObjectId;
}

export interface Insurance {
  provider: string;
  policyNo: string;
  validTill: Date;
}

export interface PortfolioItem {
  title: string;
  fileId: Types.ObjectId;
}

export interface GeoHome {
  type: "Point";
  coordinates: [number, number];
}

export interface Approval {
  status: ApprovalStatus;
  approvedBy: Types.ObjectId;
  approvedAt: Date;
  note: string;
}

export interface Contractor {
  companyName: string;
  services: string[];
  license: string;
  taxId: string;
  insurance: Insurance;
  portfolio: PortfolioItem[];
  geoHome: GeoHome;
  radiusKm: number;
  featured: boolean;
  verifiedBadge: boolean;
  rank: number;
  subscriptionId: Types.ObjectId;
  approval: Approval;
}

export interface IUser extends Document {
  role: UserRole;
  email: string;
  phone: string;
  passwordHash: string;
  status: UserStatus;
  customer?: Customer;
  contractor?: Contractor;
}
