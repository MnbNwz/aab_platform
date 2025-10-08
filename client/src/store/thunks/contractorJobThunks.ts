import { createAsyncThunk } from "@reduxjs/toolkit";
import { contractorJobApi } from "../../services/contractorJobService";
import type { ContractorJobFilters } from "../../types";

// Get Contractor Jobs
export const getContractorJobsThunk = createAsyncThunk(
  "contractorJob/getContractorJobs",
  async (filters: ContractorJobFilters = {}, { rejectWithValue }) => {
    try {
      const response = await contractorJobApi.fetchContractorJobs(filters);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch contractor jobs";
      return rejectWithValue(errorMessage);
    }
  }
);

// Get Contractor Job by ID (consumes a lead)
export const getContractorJobByIdThunk = createAsyncThunk(
  "contractorJob/getContractorJobById",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await contractorJobApi.getContractorJobById(jobId);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch job details";
      return rejectWithValue(errorMessage);
    }
  }
);
