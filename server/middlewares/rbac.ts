import { Request, Response, NextFunction } from "express";
import { RequireRole } from "@middlewares/types";
import { IUser } from "@models/types/user";

// Augment the Express Request type
type RequestWithUser = Request & {
  user?: IUser;
};

export const requireRole = (roles: Array<RequireRole>) => {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
};
