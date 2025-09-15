import { createAsyncThunk } from "@reduxjs/toolkit";
import { jobApi } from "../../services/jobService";

// Create Job Request
export const createJobThunk = createAsyncThunk(
  "job/createJob",
  async (jobData: any, { rejectWithValue }) => {
    try {
      const response = await jobApi.createJob(jobData);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to create job");
      }
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to create job";
      return rejectWithValue(errorMessage);
    }
  }
);

// Get Job Requests
export const getJobsThunk = createAsyncThunk(
  "job/getJobs",
  async (filters: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await jobApi.fetchJobs(filters);
      return response.data; // Return full response including pagination
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch jobs";
      return rejectWithValue(errorMessage);
    }
  }
);

// Get Job by ID
export const getJobByIdThunk = createAsyncThunk(
  "job/getJobById",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await jobApi.getJobById(jobId);
      return response.data.job || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch job";
      return rejectWithValue(errorMessage);
    }
  }
);

// Update Job Request
export const updateJobThunk = createAsyncThunk(
  "job/updateJob",
  async (
    { jobId, updateData }: { jobId: string; updateData: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await jobApi.updateJob(jobId, updateData);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to update job");
      }
      return response.data.job || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update job";
      return rejectWithValue(errorMessage);
    }
  }
);

// Cancel Job Request
export const cancelJobThunk = createAsyncThunk(
  "job/cancelJob",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await jobApi.cancelJob(jobId);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || "Failed to cancel job");
      }
      return response.data.job || response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to cancel job";
      return rejectWithValue(errorMessage);
    }
  }
);
