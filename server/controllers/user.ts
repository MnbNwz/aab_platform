import { Request, Response } from "express";
import * as userRepo from "../repositories/user";
import { CreateUserRequest, UpdateUserRequest } from "./types/user";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepo.createUser(req.body as CreateUserRequest);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepo.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepo.updateUser(req.params.id, req.body as UpdateUserRequest);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await userRepo.deleteUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await userRepo.findUsers(req.query);
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

// Get only admin users - available for all users! 🎉
export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const admins = await userRepo.findAdminUsers();

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
