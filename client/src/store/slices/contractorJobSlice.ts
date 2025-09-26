import { createSlice } from "@reduxjs/toolkit";
import {
  getContractorJobsThunk,
  getContractorJobByIdThunk,
  checkContractorJobAccessThunk,
} from "../thunks/contractorJobThunks";
import type {
  ContractorJob,
  MembershipInfo,
  LeadInfo,
  ContractorJobFilters,
} from "../../types";

export interface ContractorJobState {
  jobs: ContractorJob[];
  currentJob: ContractorJob | null;
  loading: boolean;
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
  accessCheck: {
    canAccess: boolean;
    accessTime?: string;
    leadsUsed?: number;
    leadsLimit?: number;
  } | null;
}

const initialState: ContractorJobState = {
  jobs: [],
  currentJob: null,
  loading: false,
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
  },
  accessCheck: null,
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
      };
    },
    clearAccessCheck: (state) => {
      state.accessCheck = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Contractor Jobs
      .addCase(getContractorJobsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContractorJobsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.success) {
          state.jobs = action.payload.data.jobs;
          state.pagination = action.payload.data.pagination;
          state.membershipInfo = action.payload.data.membershipInfo;
          state.leadInfo = action.payload.data.leadInfo;
        }
      })
      .addCase(getContractorJobsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Contractor Job by ID
      .addCase(getContractorJobByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContractorJobByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.success) {
          state.currentJob = action.payload.job;
          state.leadInfo = action.payload.leadInfo;
        }
      })
      .addCase(getContractorJobByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Check Job Access
      .addCase(checkContractorJobAccessThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(checkContractorJobAccessThunk.fulfilled, (state, action) => {
        state.error = null;
        if (action.payload.success) {
          state.accessCheck = action.payload.data;
        }
      })
      .addCase(checkContractorJobAccessThunk.rejected, (state, action) => {
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
  clearAccessCheck,
} = contractorJobSlice.actions;

export default contractorJobSlice.reducer;
