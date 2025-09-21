import { api } from "./apiService";

// Job API functions
export const jobApi = {
  // Create Job Request
  createJob: async (jobData: any) => {
    return api.post("/api/job/requests", jobData);
  },

  // Get Job Requests
  fetchJobs: async (filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        params.append(key, String(value));
    });
    return api.get(`/api/job/requests?${params.toString()}`);
  },

  // Get Job by ID
  getJobById: async (jobId: string) => {
    return api.get(`/api/job/requests/${jobId}`);
  },

  // Update Job Request
  updateJob: async (jobId: string, updateData: any) => {
    return api.put(`/api/job/requests/${jobId}`, updateData);
  },

  // Cancel Job Request
  cancelJob: async (jobId: string) => {
    return api.put(`/api/job/requests/${jobId}/cancel`);
  },
};
