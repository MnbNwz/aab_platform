import { User } from "../models";
import { FilterQuery, UpdateQuery } from "mongoose";
import { CreateUserDTO, UpdateUserDTO } from "./types/user";

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
