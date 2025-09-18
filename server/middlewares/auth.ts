import { Response, NextFunction } from "express";
import { verifyToken } from "@services/auth";
import { User } from "@models/user";

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // First, try to get token from cookies (preferred for security)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to Authorization header for API compatibility
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // if (user.status === "revoke") {
    //   res.status(401).json({ error: "Account has been revoked" });
    //   return;
    // }

    // Clean user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    req.user = { ...userObj, _id: userObj._id.toString() };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
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
