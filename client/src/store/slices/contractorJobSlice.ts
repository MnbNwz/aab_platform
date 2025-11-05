import { createSlice } from "@reduxjs/toolkit";
import {
  getContractorJobsThunk,
  getContractorSelfJobsThunk,
  getContractorJobByIdThunk,
} from "../thunks/contractorJobThunks";
import type {
  ContractorJob,
  ContractorJobDetails,
  MembershipInfo,
  LeadInfo,
  ContractorJobFilters,
} from "../../types";

export interface ContractorJobState {
  jobs: ContractorJob[];
  currentJob: ContractorJobDetails | null; // Full job details when accessing specific job
  loading: boolean; // For jobs list
  jobDetailsLoading: boolean; // For job details modal
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    total: number;
  };
  membershipInfo: MembershipInfo | null;
  leadInfo: LeadInfo | null;
  filters: ContractorJobFilters;
}

const initialState: ContractorJobState = {
  jobs: [],
  currentJob: null,
  loading: false,
  jobDetailsLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  },
  membershipInfo: null,
  leadInfo: null,
  filters: {
    page: 1,
    limit: 10,
    service: "",
    search: "",
    status: "open",
  },
};

const contractorJobSlice = createSlice({
  name: "contractorJob",
  initialState,
  reducers: {
    clearContractorJobError: (state) => {
      state.error = null;
    },
    clearCurrentContractorJob: (state) => {
      state.currentJob = null;
    },
    setContractorJobFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setContractorJobPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearContractorJobFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        service: "",
        search: "",
        status: "open",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Contractor Jobs (Available Jobs)
      .addCase(getContractorJobsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContractorJobsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // action.payload is directly the data object from thunk (response.data)
        // It contains: { jobs, total, pagination, membershipInfo?, leadInfo? }
        state.jobs = action.payload.jobs || [];
        state.pagination = {
          ...action.payload.pagination,
          total: action.payload.total,
        };
        // Backend no longer returns membershipInfo and leadInfo
        // These are now handled separately or removed
        state.membershipInfo = action.payload.membershipInfo || null;
        state.leadInfo = action.payload.leadInfo || null;
      })
      .addCase(getContractorJobsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Contractor's Own Jobs (Started Jobs - simplified job information)
      .addCase(getContractorSelfJobsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContractorSelfJobsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Response contains simplified job objects: _id (bid ID), title, service, estimate, timeline
        // Preserve bidAmount if available (it's the agreed bid price)
        state.jobs = (action.payload.jobs || []).map((job: any) => ({
          _id: job._id,
          title: job.title || "",
          description: "",
          service: job.service || "",
          estimate: job.estimate || 0,
          bidAmount: job.bidAmount || job.estimate || 0,
          customerEstimate: job.customerEstimate || null,
          type: "regular" as const,
          status: "in_progress" as const,
          timeline: job.timeline || 0,
          createdAt: "",
          updatedAt: "",
          distance: 0,
        }));
        state.pagination = {
          ...action.payload.pagination,
          total: action.payload.total,
        };
        state.membershipInfo = null;
        state.leadInfo = null;
      })
      .addCase(getContractorSelfJobsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Contractor Job by ID (consumes a lead)
      .addCase(getContractorJobByIdThunk.pending, (state) => {
        state.jobDetailsLoading = true; // Separate loader for job details
        state.error = null;
      })
      .addCase(getContractorJobByIdThunk.fulfilled, (state, action) => {
        state.jobDetailsLoading = false;
        state.error = null;
        // New API response: job data is directly in action.payload (no nested .job)
        state.currentJob = action.payload || null;
      })
      .addCase(getContractorJobByIdThunk.rejected, (state, action) => {
        state.jobDetailsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearContractorJobError,
  clearCurrentContractorJob,
  setContractorJobFilters,
  setContractorJobPagination,
  clearContractorJobFilters,
} = contractorJobSlice.actions;

export default contractorJobSlice.reducer;
