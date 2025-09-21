import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import { showToast } from "../../utils/toast";
import type { UserVerification } from "../../types";
import {
  setVerificationState,
  setError,
  setVerifying,
  setResending,
  updateCooldown,
} from "../slices/verificationSlice";

// Verify OTP
export const verifyOTPThunk = createAsyncThunk<
  {
    message: string;
    user: any;
    userVerification: UserVerification;
  },
  { email: string; otpCode: string },
  { rejectValue: string }
>(
  "verification/verifyOTP",
  async ({ email, otpCode }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setVerifying(true));
      dispatch(setError(""));

      const response = await api.auth.verifyOTP(email, otpCode);

      // Update verification state (otpCode is never stored for security)
      dispatch(setVerificationState(response.userVerification));

      showToast.success(response.message);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setError(errorMessage));
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setVerifying(false));
    }
  }
);

// Resend OTP
export const resendOTPThunk = createAsyncThunk<
  {
    message: string;
    userVerification: UserVerification;
  },
  { email: string },
  { rejectValue: string }
>(
  "verification/resendOTP",
  async ({ email }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setResending(true));
      dispatch(setError(""));

      const response = await api.auth.resendOTP(email);

      // Update verification state (otpCode is never stored for security)
      dispatch(setVerificationState(response.userVerification));

      showToast.success(response.message);
      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setError(errorMessage));
      showToast.error(errorMessage);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setResending(false));
    }
  }
);

// Get verification state
export const getVerificationStateThunk = createAsyncThunk<
  {
    email: string;
    firstName: string;
    isVerified: boolean;
    message: string;
    otpCode: string | null;
    canResend: boolean;
    cooldownSeconds: number;
  },
  { email: string },
  { rejectValue: string }
>(
  "verification/getVerificationState",
  async ({ email }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.auth.getVerificationState(email);

      // Update verification state (otpCode is never stored for security)
      dispatch(
        setVerificationState({
          isVerified: response.isVerified,
          message: response.message,
          otpCode: null, // Never store otpCode for security
          canResend: response.canResend,
          cooldownSeconds: response.cooldownSeconds,
          otpExpiresInSeconds: 0, // Default value since API doesn't return this
        })
      );

      return response;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Start cooldown timer
export const startCooldownTimerThunk = createAsyncThunk<
  void,
  { email: string; cooldownSeconds: number },
  { rejectValue: string }
>(
  "verification/startCooldownTimer",
  async ({ cooldownSeconds }, { dispatch }) => {
    // Start countdown timer
    const timer = setInterval(() => {
      dispatch(updateCooldown(cooldownSeconds - 1));
      cooldownSeconds--;

      if (cooldownSeconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  }
);
