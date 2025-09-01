import { Request } from "express";
import { SanitizedUser } from "./auth";

export interface AuthenticatedRequest extends Omit<Request, "user"> {
  user?: SanitizedUser;
}
