import { Types, Document } from "mongoose";

export type UserRole = "admin" | "customer" | "contractor";
export type UserStatus = "pending" | "active" | "revoke";
export type PropertyType = "domestic" | "commercial";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type MembershipType = "standard" | "premium" | "platinum";

// Base interface for shared profile fields
export interface BaseProfile {
  subscriptionId?: Types.ObjectId;
  membershipId?: Types.ObjectId;
  approval: ApprovalStatus;
}

export interface Customer extends BaseProfile {
  defaultPropertyType: PropertyType;
}

export interface GeoHome {
  type: "Point";
  coordinates: [number, number];
}

export interface Contractor extends BaseProfile {
  companyName: string;
  services: string[];
  license: string;
  taxId: string;
  docs: { type: [object]; required: true };
}

export interface IUser extends Document {
  role: UserRole;
  email: string;
  phone: string;
  passwordHash: string;
  status: UserStatus;
  customer?: Customer;
  contractor?: Contractor;
  geoHome: GeoHome;
}
