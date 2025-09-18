import { Request } from "express";
import { SanitizedUser } from "@schemas/auth";

export interface AuthenticatedRequest extends Omit<Request, "user"> {
  user?: SanitizedUser;
}
