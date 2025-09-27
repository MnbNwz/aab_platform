import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserVerification } from "../../types";

export interface VerificationState {
  userVerification: UserVerification | null;
  isLoading: boolean;
  error: string | null;
  isVerifying: boolean;
  isResending: boolean;
}

const initialState: VerificationState = {
  userVerification: null,
  isLoading: false,
  error: null,
  isVerifying: false,
  isResending: false,
};

export const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    // Clear verification state
    clearVerificationState: (state) => {
      state.userVerification = null;
      state.error = null;
      state.isVerifying = false;
      state.isResending = false;
    },

    // Set verification state from API response
    setVerificationState: (state, action: PayloadAction<UserVerification>) => {
      state.userVerification = action.payload;
      state.error = null;
    },

    // Update cooldown timer
    updateCooldown: (state, action: PayloadAction<number>) => {
      if (state.userVerification) {
        state.userVerification.cooldownSeconds = action.payload;
        state.userVerification.canResend = action.payload === 0;
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set error
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Set loading states
    setVerifying: (state, action: PayloadAction<boolean>) => {
      state.isVerifying = action.payload;
    },

    setResending: (state, action: PayloadAction<boolean>) => {
      state.isResending = action.payload;
    },

    // Set loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  clearVerificationState,
  setVerificationState,
  updateCooldown,
  clearError,
  setError,
  setVerifying,
  setResending,
  setLoading,
} = verificationSlice.actions;

export default verificationSlice.reducer;
