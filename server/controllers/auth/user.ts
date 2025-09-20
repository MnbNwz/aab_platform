import { Request, Response } from "express";
import { userService } from "@services/auth";
import {
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@controllers/types/user";
import S3Upload from "@utils/storage";

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
    let updateData: any = {};

    // Handle file upload
    if (req.file) {
      const profileImageUrl = await S3Upload.uploadProfileImage(req.file);
      updateData.profileImage = profileImageUrl;
    }

    // Handle other data - check if it's in userData field (JSON string) or individual fields
    if (req.body.userData) {
      // Mixed approach: userData is JSON string
      const userData = JSON.parse(req.body.userData);
      updateData = { ...updateData, ...userData };
    } else {
      // FormData approach: individual fields
      const { userData, ...otherFields } = req.body;
      updateData = { ...updateData, ...otherFields };

      // Parse JSON fields if they exist
      if (otherFields.geoHome && typeof otherFields.geoHome === "string") {
        updateData.geoHome = JSON.parse(otherFields.geoHome);
      }
      if (otherFields.customer && typeof otherFields.customer === "string") {
        updateData.customer = JSON.parse(otherFields.customer);
      }
      if (otherFields.contractor && typeof otherFields.contractor === "string") {
        updateData.contractor = JSON.parse(otherFields.contractor);
      }
    }

    const user = await userService.updateUser(req.params.id, updateData as UpdateUserRequest);
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
