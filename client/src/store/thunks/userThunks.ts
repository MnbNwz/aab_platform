import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import { showToast } from "../../utils/toast";
import type { User } from "../../types";

interface UpdateProfileParams {
  userId: string;
  profileData: Partial<User>;
  successMessage?: string;
}

interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export const updateProfileThunk = createAsyncThunk<
  User,
  UpdateProfileParams,
  {
    rejectValue: string;
  }
>(
  "user/updateProfile",
  async ({ userId, profileData, successMessage }, { rejectWithValue }) => {
    try {
      const response = await api.auth.updateProfile(userId, profileData);
      showToast.success(successMessage || "Profile updated successfully!");
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const changePasswordThunk = createAsyncThunk<
  void,
  ChangePasswordParams,
  {
    rejectValue: string;
  }
>(
  "user/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      showToast.success("Password changed successfully!");
    } catch (error) {
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
