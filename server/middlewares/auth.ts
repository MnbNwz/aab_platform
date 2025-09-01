import { Response, NextFunction } from "express";
import { verifyToken } from "../services/auth";
import { User } from "../models/user";

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const { userId } = verifyToken(token);

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (user.status === "revoke") {
      res.status(401).json({ error: "Account has been revoked" });
      return;
    }

    // Clean user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    req.user = { ...userObj, _id: userObj._id.toString() };

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(["admin"]);
export const requireCustomer = requireRole(["customer"]);
export const requireContractor = requireRole(["contractor"]);
