import { Response, NextFunction } from "express";
import { MIDDLEWARE_ERROR_MESSAGES, HTTP_STATUS } from "../constants";

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ error: MIDDLEWARE_ERROR_MESSAGES.INSUFFICIENT_ROLE });
    }
    next();
  };
};

export const requireContractor = requireRole(["contractor"]);
export const requireCustomer = requireRole(["customer"]);
export const requireAdmin = requireRole(["admin"]);
