import { IUser } from "../../models/types/user";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export type RequireRole = IUser["role"];
