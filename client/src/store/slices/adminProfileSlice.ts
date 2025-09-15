import { createSlice } from "@reduxjs/toolkit";
import { fetchAdminProfileThunk } from "../thunks/adminProfileThunks";
import type { User } from "../../types";

export interface AdminProfileState {
  adminProfiles: User[];
  primaryAdmin: User | null;
  isLoading: boolean;
  error: string | null;
  isLoaded: boolean;
}

const initialState: AdminProfileState = {
  adminProfiles: [],
  primaryAdmin: null,
  isLoading: false,
  error: null,
  isLoaded: false,
};

export const adminProfileSlice = createSlice({
  name: "adminProfile",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    resetAdminProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProfileThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminProfiles = action.payload;
        // Set primary admin as the first admin, or null if no admins
        state.primaryAdmin =
          action.payload.length > 0 ? action.payload[0] : null;
        state.isLoaded = true;
        state.error = null;
      })
      .addCase(fetchAdminProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isLoaded = false;
      });
  },
});

export const { clearError, resetAdminProfile } = adminProfileSlice.actions;
export default adminProfileSlice.reducer;
