import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import { showToast } from "../../utils/toast";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "../../types";

// Async thunks for authentication
export const loginThunk = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.auth.login(credentials);

    showToast.success("Welcome back! Login successful.");
    return response;
  } catch (error) {
    console.error("❌ Login failed:", error);
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
    return rejectWithValue(errorMessage);
  }
});

export const registerThunk = createAsyncThunk<
  AuthResponse,
  RegisterData | FormData,
  { rejectValue: string }
>("auth/register", async (userData, { rejectWithValue, dispatch }) => {
  try {
    // For FormData, log only keys
    const response = await api.auth.register(userData);

    // If the response includes userVerification, set it immediately
    if (response.user.userVerification) {
      const { setVerificationState } = await import(
        "../slices/verificationSlice"
      );
      dispatch(setVerificationState(response.user.userVerification));
    } else {
      // If no userVerification in response, set default unverified state
      const { setVerificationState } = await import(
        "../slices/verificationSlice"
      );
      dispatch(
        setVerificationState({
          isVerified: false,
          message: "Please verify your email address",
          otpCode: null,
          canResend: true,
          cooldownSeconds: 0,
          otpExpiresInSeconds: 0,
        })
      );
    }

    showToast.success("Account created successfully! Welcome to AAS Platform.");
    return response;
  } catch (error) {
    console.error("❌ Registration failed:", error);
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
    return rejectWithValue(errorMessage);
  }
});

export const logoutThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    // Call logout API to invalidate token on server
    await api.auth.logout();
    showToast.success("Logged out successfully. See you soon!");
  } catch (error) {
    // Even if logout fails, we still want to clear local state
    showToast.success("Logged out successfully. See you soon!");
    return rejectWithValue(handleApiError(error));
  }
});

export const getProfileThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/getProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.auth.getProfile();
    return response;
  } catch (error) {
    return rejectWithValue(handleApiError(error));
  }
});

export const restoreSessionThunk = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/restoreSession", async (_, { rejectWithValue }) => {
  try {
    // Try to get user profile from API using stored token
    const response = await api.auth.getProfile();
    return response;
  } catch (error) {
    // If token is invalid or expired, just proceed to login
    return rejectWithValue("Session expired");
  }
});

// OTP Verification thunks - These are now handled by verificationThunks.ts
// Keeping these for backward compatibility but they redirect to verification thunks
export const verifyOTPThunk = createAsyncThunk<
  AuthResponse,
  { email: string; otp: string },
  { rejectValue: string }
>("auth/verifyOTP", async ({ email, otp }, { rejectWithValue }) => {
  try {
    const response = await api.auth.verifyOTP(email, otp);
    showToast.success("Email verified successfully!");
    return response;
  } catch (error) {
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
    return rejectWithValue(errorMessage);
  }
});

export const resendOTPThunk = createAsyncThunk<
  void,
  { email: string },
  { rejectValue: string }
>("auth/resendOTP", async ({ email }, { rejectWithValue }) => {
  try {
    await api.auth.resendOTP(email);
    showToast.success("Verification code sent to your email!");
  } catch (error) {
    const errorMessage = handleApiError(error);
    showToast.error(errorMessage);
    return rejectWithValue(errorMessage);
  }
});
