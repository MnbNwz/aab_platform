import { api } from "./apiService";
import type { ContractorJobFilters } from "../types";

// Contractor Job API functions
export const contractorJobApi = {
  // Get Jobs for Contractor (Available Jobs - jobs contractor can bid on)
  // Endpoint: GET /api/job/contractor/jobs
  // Status values: "open", "inprogress", "hold", "completed", "cancelled"
  fetchContractorJobs: async (filters: ContractorJobFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    return api.get(`/api/job/contractor/jobs?${params.toString()}`);
  },

  // Get Contractor's Own Jobs (Started Jobs - jobs contractor has bid on)
  // Endpoint: GET /api/job/contractor/jobs/self
  // Returns simplified job information: _id (bid ID), title, service, estimate, timeline
  // Status values: "open", "inprogress", "hold", "completed", "cancelled"
  fetchContractorSelfJobs: async (
    filters: ContractorJobFilters & { bidStatus?: string } = {}
  ) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    return api.get(`/api/job/contractor/jobs/self?${params.toString()}`);
  },

  // Get Specific Job Details (consumes a lead)
  // Optional bidInfo parameter: if true, includes bid information in response
  getContractorJobById: async (jobId: string, bidInfo?: boolean) => {
    const params = new URLSearchParams();
    if (bidInfo) {
      params.append("bidInfo", "true");
    }
    const queryString = params.toString();
    return api.get(
      `/api/job/contractor/jobs/${jobId}${queryString ? `?${queryString}` : ""}`
    );
  },
};
