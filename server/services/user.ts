import { User } from "../models";
import { FilterQuery, UpdateQuery } from "mongoose";
import { CreateUserDTO, UpdateUserDTO } from "../models/types/user";
import { hashPassword } from "../utils/auth/password";

export const createUser = async (userData: CreateUserDTO) => {
  return await User.create(userData);
};

export const getUserById = async (id: string) => {
  return await User.findById(id);
};

export const updateUser = async (id: string, update: UpdateUserDTO) => {
  return await User.findByIdAndUpdate(id, update, { new: true });
};

export const deleteUser = async (id: string) => {
  return await User.findByIdAndDelete(id);
};

export const findUsers = async (filter: FilterQuery<CreateUserDTO>) => {
  return await User.find(filter);
};

export const findAdminUsers = async () => {
  return await User.find({ role: "admin" }).select("-passwordHash").lean();
};

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify current password
  const currentPasswordHash = hashPassword(currentPassword);
  if (user.passwordHash !== currentPasswordHash) {
    throw new Error("Current password is incorrect");
  }

  // Update with new password
  const newPasswordHash = hashPassword(newPassword);
  return await User.findByIdAndUpdate(
    userId,
    { passwordHash: newPasswordHash },
    { new: true },
  ).select("-passwordHash");
};
