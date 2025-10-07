import { Types, Document } from "./mongoose";

export type UserRole = "admin" | "customer" | "contractor";
export type UserStatus = "pending" | "active" | "revoke";
export type PropertyType = "domestic" | "commercial";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type MembershipType = "basic" | "standard" | "premium";

export interface Customer {
  defaultPropertyType: PropertyType;
}

export interface GeoHome {
  type: "Point";
  coordinates: [number, number];
}

export interface Contractor {
  companyName: string;
  services: string[];
  license: string;
  taxId: string;
  docs: { type: [object]; required: true };
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  role: UserRole;
  email: string;
  phone: string;
  passwordHash: string;
  status: UserStatus;
  customer?: Customer;
  contractor?: Contractor;
  geoHome: GeoHome;
  approval: ApprovalStatus;
  profileImage?: string;
  // User verification object
  userVerification: {
    isVerified: boolean;
    otpCode: string | null;
    otpExpiresAt: Date | null;
    lastSentAt: Date | null;
    canResend: boolean;
    cooldownSeconds: number;
  };
  // Password reset object
  passwordReset: {
    token: string | null;
    expiresAt: Date | null;
    lastRequestedAt: Date | null;
  };
  // Stripe fields
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  stripeConnectStatus?: "pending" | "active" | "rejected" | "disabled";
  // Favorites (customers only - max 10 contractors)
  favoriteContractors?: Types.ObjectId[];
}

// DTO types for user operations
export type CreateUserDTO = Partial<IUser>;
export type UpdateUserDTO = Partial<IUser>;
