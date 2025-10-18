import { Request, Response } from "express";
import { getAdminAnalytics } from "@services/analytics";

// Get comprehensive analytics (admin only)
export const getAnalyticsController = async (req: Request, res: Response) => {
  try {
    const analytics = await getAdminAnalytics();

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      description: "Comprehensive platform analytics and business intelligence",
    });
  } catch (error) {
    console.error("❌ Analytics fetch error:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: (error as any)?.message,
    });
  }
};
