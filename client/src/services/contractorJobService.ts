import { api } from "./apiService";
import type { ContractorJobFilters } from "../types";

// Contractor Job API functions
export const contractorJobApi = {
  // Get Jobs for Contractor
  fetchContractorJobs: async (filters: ContractorJobFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        if (key === "status" && value === "in_progress") {
          params.append(key, "inprogress");
        } else {
          params.append(key, String(value));
        }
      }
    });
    return api.get(`/api/job/contractor/jobs?${params.toString()}`);
  },

  // Get Specific Job Details (consumes a lead)
  getContractorJobById: async (jobId: string) => {
    return api.get(`/api/job/contractor/jobs/${jobId}`);
  },
};
