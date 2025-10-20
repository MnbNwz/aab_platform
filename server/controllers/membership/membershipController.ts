import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { ALLOWED_USER_TYPES } from "@controllers/constants/validation";
import { toObjectId } from "@utils/core";
import {
  getAllPlans,
  getPlansByUserType,
  getCurrentMembership,
} from "@services/membership/membership";
import { UserMembership } from "@models/user";

// Get all available plans
export async function getAllPlansController(req: Request, res: Response) {
  try {
    const plans = await getAllPlans();
    res.json({ success: true, data: plans });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
}

// Get current active membership for user
export async function getCurrentMembershipController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const membership = await getCurrentMembership(req.user._id);
    res.json({ success: true, data: membership });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch current membership" });
  }
}

export async function getMembershipHistoryController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const history = await UserMembership.find({ userId: toObjectId(req.user._id) })
      .sort({ startDate: -1 })
      .populate("planId")
      .lean();
    res.json({ success: true, data: history });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch membership history" });
  }
}

export async function getMembershipStatsController(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  try {
    const stats = await UserMembership.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const result: Record<string, number> = {
      totalMemberships: 0,
      activeMemberships: 0,
      cancelledMemberships: 0,
      expiredMemberships: 0,
    };
    let total = 0;
    for (const s of stats) {
      total += s.count;
      if (s._id === "active") result.activeMemberships = s.count;
      if (s._id === "cancelled") result.cancelledMemberships = s.count;
      if (s._id === "expired") result.expiredMemberships = s.count;
    }
    result.totalMemberships = total;
    res.json({
      success: true,
      data: result,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}

export async function getPlansByUserTypeController(req: Request, res: Response) {
  const userTypeRaw = req.params.userType || req.query.userType;
  const allowedTypes = ALLOWED_USER_TYPES;
  const userType =
    typeof userTypeRaw === "string" && allowedTypes.includes(userTypeRaw)
      ? (userTypeRaw as "customer" | "contractor")
      : null;
  if (!userType) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing userType parameter" });
  }
  try {
    const plans = await getPlansByUserType(userType);
    res.json({ success: true, data: plans });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch plans for user type" });
  }
}
