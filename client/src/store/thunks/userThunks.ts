import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import { showToast } from "../../utils/toast";
import type { User } from "../../types";

interface UpdateProfileParams {
  userId: string;
  profileData: Partial<User>;
}

export const updateProfileThunk = createAsyncThunk<
  User,
  UpdateProfileParams,
  {
    rejectValue: string;
  }
>(
  "user/updateProfile",
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await api.auth.updateProfile(userId, profileData);
      showToast.success("Profile updated successfully!");
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);
