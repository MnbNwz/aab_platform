import { Request, Response } from "express";
import * as userService from "../services/user";
import { CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from "./types/user";
import S3Service from "../services/s3Service";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body as CreateUserRequest);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const updateUser = async (req: Request & { file?: any }, res: Response) => {
  try {
    if (req.file) {
      const s3 = new S3Service();
      const profileImageUrl = await s3.uploadProfileImage(req.params.id, req.file);
      req.body.profileImage = profileImageUrl;
    }

    const user = await userService.updateUser(req.params.id, req.body as UpdateUserRequest);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.findUsers(req.query);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

// Get only admin users - available for all users! 🎉
export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const admins = await userService.findAdminUsers();

    res.status(200).json({
      success: true,
      message: "Admin users retrieved successfully! 🎉",
      admins,
      count: admins.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve admin users",
    });
  }
};

// Change user password - requires authentication
export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - User not authenticated",
      });
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

    // Change password using repository
    const updatedUser = await userService.changeUserPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully! 🔒",
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "Failed to change password",
    });
  }
};
