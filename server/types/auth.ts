import { UserRole } from "@/models/types/user";

export interface CustomerSignupData {
  defaultPropertyType: "domestic" | "commercial";
  subscriptionId: string;
  membershipId: string;
}

export interface ContractorSignupData {
  companyName: string;
  services: string[];
  license: string;
  taxId: string;
  docs: string[];
  subscriptionId: string;
  membershipId: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  phone: string;
  role: "customer" | "contractor";
  customer?: CustomerSignupData;
  contractor?: ContractorSignupData;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SanitizedUser;
  token: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface SanitizedUser {
  _id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  customer?: Record<string, unknown>;
  contractor?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}
