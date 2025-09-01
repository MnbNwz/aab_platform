import { Request, Response } from "express";
import { signup, signin } from "../services/auth";

export const signupController = async (req: Request, res: Response) => {
  try {
    const result = await signup(req.body);
    res.status(201).json({
      message: "User created successfully",
      ...result,
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
    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || "Login failed",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
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
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to get profile",
    });
  }
};
