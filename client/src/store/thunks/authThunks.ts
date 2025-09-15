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
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    // For FormData, log only keys
    const response = await api.auth.register(userData);
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
