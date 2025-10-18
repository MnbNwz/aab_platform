import { createSlice } from "@reduxjs/toolkit";
import {
  createJobThunk,
  getJobsThunk,
  getJobByIdThunk,
  updateJobThunk,
  cancelJobThunk,
} from "../thunks/jobThunks";
import type { Job, JobState } from "../../types/job";

export type { Job, JobState };

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  cancelLoading: false,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    totalCount: 0,
    itemsPerPage: 10,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: "",
    status: "",
    service: "",
    type: "",
    category: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  },
};

const jobSlice = createSlice({
  name: "job",
  initialState,
  reducers: {
    clearJobError: (state) => {
      state.error = null;
    },
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
    setJobFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setJobPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearJobFilters: (state) => {
      state.filters = {
        search: "",
        status: "",
        service: "",
        type: "",
        category: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Job
      .addCase(createJobThunk.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createJobThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        state.error = null;
        if (action.payload.success) {
          state.jobs.unshift(action.payload.job);
        }
      })
      .addCase(createJobThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })

      // Get Jobs
      .addCase(getJobsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.jobs = action.payload.jobs || action.payload;
        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
      })
      .addCase(getJobsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Job by ID
      .addCase(getJobByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.currentJob = action.payload;
      })
      .addCase(getJobByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Job
      .addCase(updateJobThunk.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateJobThunk.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.error = null;
        const index = state.jobs.findIndex(
          (job) => job._id === action.payload._id
        );
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(updateJobThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })

      // Cancel Job
      .addCase(cancelJobThunk.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelJobThunk.fulfilled, (state, action) => {
        state.cancelLoading = false;
        state.error = null;
        const index = state.jobs.findIndex(
          (job) => job._id === action.payload._id
        );
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob?._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(cancelJobThunk.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearJobError,
  clearCurrentJob,
  setJobFilters,
  setJobPagination,
  clearJobFilters,
} = jobSlice.actions;
export default jobSlice.reducer;
