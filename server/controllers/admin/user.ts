import { Request, Response } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  bulkApproveUsers,
  bulkRejectUsers,
  UserFilters,
  PaginationOptions,
  UserUpdateData,
} from "../../services/admin/user";
import { UserRole, UserStatus, ApprovalStatus } from "../../models/types/user";

// Get all users with filtering and pagination
export const getUsersController = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const {
      role,
      status,
      approval,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filters
    const filters: UserFilters = {};
    if (role) filters.role = role as UserRole;
    if (status) filters.status = status as UserStatus;
    if (approval) filters.approval = approval as ApprovalStatus;
    if (search) filters.search = search as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    // Build pagination options
    const pagination: PaginationOptions = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await getAllUsers(filters, pagination);

    res.status(200).json({
      message: "Users retrieved successfully",
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to retrieve users",
    });
  }
};

// Get user by ID
export const getUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);

    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error: any) {
    res.status(404).json({
      error: error.message || "User not found",
    });
  }
};

// Update user
export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData: UserUpdateData = req.body;

    const user = await updateUser(userId, updateData);

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to update user",
    });
  }
};

// Revoke user (change status to revoke)
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await deleteUser(userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(404).json({
      error: error.message || "User not found",
    });
  }
};

// Get user statistics
export const getUserStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await getUserStats();

    res.status(200).json({
      message: "User statistics retrieved successfully",
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to retrieve user statistics",
    });
  }
};
