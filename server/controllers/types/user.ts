import { CreateUserDTO, UpdateUserDTO } from "@models/types/user";

export type CreateUserRequest = CreateUserDTO;
export type UpdateUserRequest = UpdateUserDTO;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
