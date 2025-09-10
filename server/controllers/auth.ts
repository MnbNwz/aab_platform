import { Request, Response } from "express";
import { signup, signin } from "../services/auth";
import S3Service from "../services/s3Service";
import { User } from "../models/user";

import { hashPassword } from "../utils/auth/password";

export const signupController = async (req: Request & { files?: any[] }, res: Response) => {
  try {
    const signupData = req.body;
    // If files are present (contractor docs), upload to S3 and add URLs to contractor.docs
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const s3 = new S3Service();
      const docUrls = [];
      for (const file of req.files) {
        // Use a unique key for each file (e.g., contractor_email/timestamp_filename)
        const key = `contractor_docs/${signupData.email || Date.now()}_${file.originalname}`;
        const url = await s3.uploadFile(key, file.buffer, file.mimetype);
        docUrls.push({ name: file.originalname, url });
      }
      // Attach docs to contractor object in signupData
      if (!signupData.contractor) signupData.contractor = {};
      signupData.contractor.docs = docUrls;
    }
    const result = await signup(signupData);
    // Set tokens in HTTP-only cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(201).json({
      message: "User created successfully",
      user: result.user,
      // Don't send tokens in response body for security
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Signup failed",
    });
  }
};

export const signinController = async (req: Request, res: Response) => {
  try {
    const result = await signin(req.body);

    // Set tokens in HTTP-only cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: "Login successful",
      user: result.user,
      // Don't send tokens in response body for security
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || "Login failed",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Clear the authentication cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    message: "Logout successful",
  });
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to get profile",
    });
  }
};

// Edit profile controller
export const editProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "geoHome",
      "customer",
      "contractor",
    ];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Optionally allow password change
    if (req.body.password) {
      updates.passwordHash = hashPassword(req.body.password);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
};
