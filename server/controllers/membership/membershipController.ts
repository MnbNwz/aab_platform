import { Request, Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import {
  getAllPlans,
  getPlansByUserType,
  getPlansByUserTypeAndBilling,
  getCurrentMembership,
  getPlanById,
} from "@services/membership/membership";
// Get all available plans
export async function getAllPlansController(req: Request, res: Response) {
  try {
    const plans = await getAllPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch current membership" });
  }
}

// Cancel current active membership
export async function cancelMembershipController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const now = new Date();
    const result = await UserMembership.updateMany(
      { userId: req.user._id, status: "active", endDate: { $gt: now } },
      { $set: { status: "cancelled", endDate: now } },
    );
    res.json({
      success: true,
      message: "Membership cancelled",
      data: { cancelledCount: result.modifiedCount || 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to cancel membership" });
  }
}
import { UserMembership } from "@models/user";
import { Payment } from "@models/payment";

export async function purchaseMembershipController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  if (req.user.role === "admin") {
    return res.status(403).json({
      success: false,
      message: "Admins are not allowed to subscribe to membership plans.",
    });
  }

  const { planId, paymentId, billingPeriod, billingType } = req.body;
  if (!planId || !paymentId || !billingPeriod || !billingType) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const session = await UserMembership.startSession();
  session.startTransaction();
  try {
    // Fetch and validate plan
    const plan = await getPlanById(planId);
    if (!plan) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    if (plan.userType !== req.user.role) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: "You cannot subscribe to this plan type." });
    }

    // Expire any existing active memberships
    const now = new Date();
    const expiredMemberships = await UserMembership.updateMany(
      { userId: req.user._id, status: "active", endDate: { $gt: now } },
      { $set: { status: "expired", endDate: now } },
      { session },
    );

    // Create new user membership
    const duration = plan.duration || 30;
    const startDate = now;
    const endDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
    const newMembership = await UserMembership.create(
      [
        {
          userId: req.user._id,
          planId: plan._id,
          paymentId,
          status: "active",
          billingPeriod,
          billingType,
          startDate,
          endDate,
          isAutoRenew: billingType === "recurring",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    return res.json({
      success: true,
      message: "Membership purchased successfully",
      data: {
        newMembership: newMembership[0],
        expiredCount: expiredMemberships.modifiedCount || 0,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error purchasing membership:", error);
    return res.status(500).json({ success: false, message: "Failed to purchase membership" });
  }
}

export async function getMembershipHistoryController(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  try {
    const history = await UserMembership.find({ userId: req.user._id })
      .sort({ startDate: -1 })
      .populate("planId")
      .lean();
    res.json({ success: true, data: history });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}

export async function getPlansByUserTypeController(req: Request, res: Response) {
  const userTypeRaw = req.params.userType || req.query.userType;
  const { ALLOWED_USER_TYPES } = await import("@controllers/constants/validation");
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch plans for user type" });
  }
}
