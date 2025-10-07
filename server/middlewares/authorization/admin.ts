import { Response, NextFunction } from "express";
import { User } from "@models/user";
import { MIDDLEWARE_ERROR_MESSAGES, HTTP_STATUS } from "@middlewares/constants";

// Admin authorization middleware (enhanced version with database check)
export const requireAdminEnhanced = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (should be handled by auth middleware first)
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Check if user role is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Admin access required",
      });
    }

    // Verify user still exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    // Allow admin to self-activate if they're pending
    // For other operations, admin must be active
    if (user.status === "revoke") {
      return res.status(403).json({
        error: "Account has been revoked",
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      error: "Authorization failed",
    });
  }
};

// Admin or self access middleware (admin can access any user, users can access their own data)
export const requireAdminOrSelf = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Support both 'userId' and 'id' parameter names
    const targetUserId = req.params.userId || req.params.id;

    if (!targetUserId) {
      return res.status(400).json({
        error: "User ID parameter is required",
      });
    }

    // Admin can access any user's data
    if (req.user.role === "admin") {
      return next();
    }

    // Users can only access their own data
    // Convert both IDs to strings for comparison
    if (req.user._id.toString() === targetUserId.toString()) {
      return next();
    }

    return res.status(403).json({
      error: "Access denied",
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Authorization failed",
    });
  }
};
