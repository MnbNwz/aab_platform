import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    smsAlerts: boolean;
    language: string;
    timezone: string;
  };
  subscription?: {
    type: string;
    status: string;
    startDate: string;
    endDate: string;
    features: string[];
  };
}

export interface UserState {
  profile: UserProfile | null;
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
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    fetchProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
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
    
    updateProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
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
