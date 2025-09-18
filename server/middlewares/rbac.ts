import { Response, NextFunction } from "express";

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};

export const requireContractor = requireRole(["contractor"]);
export const requireCustomer = requireRole(["customer"]);
export const requireAdmin = requireRole(["admin"]);
