import { createSlice } from '@reduxjs/toolkit';
import { getServicesThunk } from '../thunks/servicesThunks';

interface ServicesState {
  services: string[];
  version: number | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if services have been fetched at least once
}

const initialState: ServicesState = {
  services: [],
  version: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Services
      .addCase(getServicesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getServicesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload.services;
        state.version = action.payload.version;
        state.lastUpdated = action.payload.lastUpdated;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(getServicesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch services';
        // Don't set isInitialized to true on error - will allow retry
      });
  },
});

export const { clearError } = servicesSlice.actions;
export default servicesSlice.reducer;
