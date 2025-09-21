// Auth-related type definitions
import { UserRole } from "@models/types/user";

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
