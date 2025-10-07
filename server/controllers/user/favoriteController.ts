import { Response } from "express";
import { AuthenticatedRequest } from "@middlewares/types";
import { HTTP_STATUS } from "@controllers/constants";
import { favoritesService } from "@services/user";

// Add contractor to favorites
export const addFavoriteContractor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { contractorId } = req.params;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await favoritesService.addFavoriteContractor(userId, contractorId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Contractor added to favorites",
      ...result,
    });
  } catch (error: any) {
    console.error("Error adding favorite contractor:", error);

    // Handle specific error cases
    if (error.message === "User not found" || error.message === "Contractor not found") {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message === "Only customers can add favorite contractors" ||
      error.message === "User is not a contractor"
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message === "Contractor already in favorites" ||
      error.message.includes("Maximum 10 favorite contractors")
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: error.message,
        maxReached: error.maxReached || false,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || "Failed to add favorite contractor",
    });
  }
};

// Remove contractor from favorites
export const removeFavoriteContractor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { contractorId } = req.params;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await favoritesService.removeFavoriteContractor(userId, contractorId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Contractor removed from favorites",
      ...result,
    });
  } catch (error: any) {
    console.error("Error removing favorite contractor:", error);

    if (error.message === "User not found" || error.message === "Contractor not in favorites") {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === "Only customers can manage favorite contractors") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || "Failed to remove favorite contractor",
    });
  }
};

// Get list of favorite contractors with sanitized details
export const getFavoriteContractors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: "Authentication required",
      });
    }

    const result = await favoritesService.getFavoriteContractors(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error getting favorite contractors:", error);

    if (error.message === "User not found") {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === "Only customers can view favorite contractors") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: error.message,
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message || "Failed to get favorite contractors",
    });
  }
};
