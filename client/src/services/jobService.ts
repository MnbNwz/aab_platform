import { api } from "./apiService";

// Job API functions
export const jobApi = {
  fetchJobs: async (filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.append(key, String(value));
    });
    return api.get(`/api/jobRequest?${params.toString()}`);
  },
  createJob: async (formData: FormData) => {
    return api.post("/api/jobRequest", formData);
  },
  // Add more job-related API methods as needed (update, delete, etc.)
};
