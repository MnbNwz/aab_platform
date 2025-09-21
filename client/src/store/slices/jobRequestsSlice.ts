import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../services/apiService";

// Types for job request filters and response
export interface JobRequestFilters {
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface JobRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: any;
  contractor?: any;
  [key: string]: any;
}

export interface JobRequestPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface JobRequestState {
  jobs: JobRequest[];
  pagination: JobRequestPagination | null;
  jobsLoading: boolean;
  jobsError: string | null;
  filters: JobRequestFilters;
}

const initialState: JobRequestState = {
  jobs: [],
  pagination: null,
  jobsLoading: false,
  jobsError: null,
  filters: { page: 1, limit: 10, sortBy: "createdAt" },
};

export const fetchJobRequestsThunk = createAsyncThunk(
  "jobs/fetchJobRequests",
  async (filters: JobRequestFilters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "")
          params.append(key, String(value));
      });
      const res = await api.get(`/api/job/requests?${params.toString()}`);
      return res;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  }
);

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const jobRequestsSlice = createSlice({
  name: "jobRequests",
  initialState,
  reducers: {
    setJobFilters(state, action: PayloadAction<Partial<JobRequestFilters>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobRequestsThunk.pending, (state) => {
        state.jobsLoading = true;
        state.jobsError = null;
      })
      .addCase(
        fetchJobRequestsThunk.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.jobsLoading = false;
          state.jobs = action.payload.jobs || [];
          state.pagination = {
            totalCount: action.payload.total,
            currentPage: action.payload.page,
            totalPages: action.payload.pages,
            limit: state.filters.limit || 10,
            hasPrevPage: (action.payload.page || 1) > 1,
            hasNextPage:
              (action.payload.page || 1) < (action.payload.pages || 1),
          };
        }
      )
      .addCase(fetchJobRequestsThunk.rejected, (state, action) => {
        state.jobsLoading = false;
        state.jobsError =
          (action.payload as string) || "Failed to fetch job requests";
      });
  },
});

export const { setJobFilters } = jobRequestsSlice.actions;
export default jobRequestsSlice.reducer;
