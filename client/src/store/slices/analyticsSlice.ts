import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardApi } from "../../services/dashboardService";
import type { AnalyticsData } from "../../types/analytics";

export interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchAnalyticsThunk = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getAnalytics();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error?.message || "Failed to fetch analytics data"
      );
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    resetAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAnalyticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAnalyticsError, resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
