import { UserRole } from "@models/types/user";
import { SanitizedUser } from "@utils/auth";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: SanitizedUser;
}

export type RequireRole = UserRole;
