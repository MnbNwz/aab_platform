import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { getCustomerAnalytics } from "@services/dashboard/customer";
import { getContractorAnalytics } from "@services/dashboard/contractor";
import { getPlatformAnalytics } from "@services/dashboard/admin";
import { CONTROLLER_ERROR_MESSAGES, HTTP_STATUS } from "@controllers/constants";

// Single smart dashboard controller - returns role-based data automatically
export const getPlatformDashboardController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: CONTROLLER_ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      });
    }

    let analytics;
    let responseData: any = {
      userRole,
      userId,
      timestamp: new Date().toISOString(),
    };

    // Get role-specific analytics
    switch (userRole) {
      case "admin":
        analytics = await getPlatformAnalytics();
        responseData = {
          ...responseData,
          platform: analytics.platform,
          summary: analytics.summary,
          period: {
            current: {
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
            },
            description: "Current month statistics",
          },
          description: "Complete platform analytics and insights",
          isAdmin: true,
        };
        break;

      case "contractor":
        analytics = await getContractorAnalytics(userId);
        if (!analytics) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: "Contractor data not found",
          });
        }
        responseData = {
          ...responseData,
          contractor: analytics,
          description: "Contractor performance metrics and lead analytics",
          isContractor: true,
        };
        break;

      case "customer": // customer dashboard
        analytics = await getCustomerAnalytics(userId);
        if (!analytics) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: "Customer data not found",
          });
        }
        responseData = {
          ...responseData,
          customer: analytics,
          description: "Customer job and payment analytics",
          isCustomer: true,
        };
        break;

      default:
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Invalid user role",
        });
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error getting dashboard analytics:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CONTROLLER_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      error: process.env.NODE_ENV === "development" ? (error as any)?.message : undefined,
    });
  }
};
