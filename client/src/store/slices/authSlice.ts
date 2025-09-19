import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  getProfileThunk,
  restoreSessionThunk,
  verifyOTPThunk,
} from "../thunks/authThunks";
import { setVerificationState } from "./verificationSlice";
import {
  updateProfileThunk,
  updateProfileWithFormDataThunk,
} from "../thunks/userThunks";
import type { User, UserRole } from "../../types";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginType: UserRole | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginType: null,
  isInitialized: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setLoginType: (state, action: PayloadAction<UserRole>) => {
      state.loginType = action.payload;
    },

    resetAuth: () => initialState,

    setInitialized: (state) => {
      state.isInitialized = true;
    },

    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.loginType = null;
      });

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed";
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loginType = null;
        state.isInitialized = true;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Logout failed";
        // Even if logout fails on server, clear local state
        state.user = null;
        state.isAuthenticated = false;
        state.loginType = null;
      });

    // Get Profile
    builder
      .addCase(getProfileThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfileThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(getProfileThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to get profile";
        state.isAuthenticated = false;
        state.user = null;
        state.isInitialized = true;
      });

    // Restore Session
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.isInitialized = true;
        // Don't set error for failed session restore
      });

    // Profile Updates - Update auth user when profile is updated
    builder
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        if (
          state.user &&
          action.payload &&
          action.payload._id &&
          state.user._id === action.payload._id
        ) {
          state.user = action.payload;
        }
      })
      .addCase(updateProfileWithFormDataThunk.fulfilled, (state, action) => {
        if (
          state.user &&
          action.payload &&
          action.payload._id &&
          state.user._id === action.payload._id
        ) {
          state.user = action.payload;
        }
      });

    // OTP Verification - Update user when OTP is verified
    builder.addCase(verifyOTPThunk.fulfilled, (state, action) => {
      if (state.user && action.payload && action.payload.user) {
        state.user = {
          ...action.payload.user,
          emailVerified: true,
        };
      }
    });
  },
});

export const {
  clearError,
  setLoginType,
  resetAuth,
  setInitialized,
  updateUser,
} = authSlice.actions;
