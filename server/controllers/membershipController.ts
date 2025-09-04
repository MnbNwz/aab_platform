import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/types";
import { MembershipService } from "../services/membershipService";

export class MembershipController {
  // Get all available plans
  static async getAllPlans(req: Request, res: Response) {
    try {
      const plans = await MembershipService.getAllPlans();
      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch membership plans"
      });
    }
  }

  // Get plans by user type
  static async getPlansByUserType(req: Request, res: Response) {
    try {
      const { userType } = req.params;
      const { billingPeriod } = req.query;
      
      if (!["customer", "contractor"].includes(userType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user type. Must be 'customer' or 'contractor'"
        });
      }

      let plans;
      if (billingPeriod && ["monthly", "yearly"].includes(billingPeriod as string)) {
        plans = await MembershipService.getPlansByUserTypeAndBilling(
          userType as "customer" | "contractor",
          billingPeriod as "monthly" | "yearly"
        );
      } else {
        plans = await MembershipService.getPlansByUserType(userType as "customer" | "contractor");
      }

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error("Error fetching plans by user type:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch membership plans"
      });
    }
  }

  // Get current user's membership
  static async getCurrentMembership(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const membership = await MembershipService.getCurrentMembership(req.user._id);
      res.json({
        success: true,
        data: membership
      });
    } catch (error) {
      console.error("Error fetching current membership:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch current membership"
      });
    }
  }

  // Purchase membership
  static async purchaseMembership(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const { planId, paymentId, stripePriceId } = req.body;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "Plan ID is required"
        });
      }

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: "Payment ID is required"
        });
      }

      if (!stripePriceId) {
        return res.status(400).json({
          success: false,
          message: "Stripe Price ID is required"
        });
      }

      const result = await MembershipService.purchaseMembership(req.user._id, planId, paymentId, stripePriceId);
      
      res.json({
        success: true,
        message: "Membership purchased successfully",
        data: {
          newMembership: result.membership,
          expiredCount: result.expiredMemberships.length
        }
      });
    } catch (error) {
      console.error("Error purchasing membership:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to purchase membership"
      });
    }
  }

  // Cancel membership
  static async cancelMembership(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const membership = await MembershipService.cancelMembership(req.user._id);
      
      if (!membership) {
        return res.status(404).json({
          success: false,
          message: "No active membership found"
        });
      }

      res.json({
        success: true,
        message: "Membership canceled successfully",
        data: membership
      });
    } catch (error) {
      console.error("Error canceling membership:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel membership"
      });
    }
  }

  // Get membership history
  static async getMembershipHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const history = await MembershipService.getMembershipHistory(req.user._id);
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error("Error fetching membership history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch membership history"
      });
    }
  }

  // Admin: Get membership statistics
  static async getMembershipStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await MembershipService.getMembershipStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error fetching membership stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch membership statistics"
      });
    }
  }
}
