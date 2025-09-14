import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserApproval, UserRole, UserStatus } from "../../types";

export interface ProfileFormState {
  role: UserRole;
  firstName: string;
  lastName: string;
  status: UserStatus;
  approval: UserApproval;
  phone: string;
  geoHome: [number, number];
  contractor?: {
    companyName: string;
    services: string[];
    license: string;
    taxId: string;
    docs: Array<{ type: string; url: string }>;
  };
  customer?: {
    defaultPropertyType: "domestic" | "commercial";
  };
}

export interface UserState {
  profile: ProfileFormState | null;
  isLoading: boolean;
  error: string | null;
  updateLoading: boolean;
}

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  updateLoading: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    fetchProfileSuccess: (state, action: PayloadAction<ProfileFormState>) => {
      state.isLoading = false;
      state.profile = action.payload;
      state.error = null;
    },

    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    updateProfileStart: (state) => {
      state.updateLoading = true;
      state.error = null;
    },

    updateProfileSuccess: (state, action: PayloadAction<ProfileFormState>) => {
      state.updateLoading = false;
      state.profile = action.payload;
      state.error = null;
    },

    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.updateLoading = false;
      state.error = action.payload;
    },

    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  clearUserError,
} = userSlice.actions;
