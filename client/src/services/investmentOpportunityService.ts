import { api } from "./apiService";
import type {
  InvestmentOpportunity,
  InvestmentOpportunityFilters,
  InvestmentOpportunitiesResponse,
  ContractorInvestmentInterest,
  InvestmentStatistics,
  ContactStatus,
} from "../types";

// Unified Investment Opportunity API (works for both Admin and Contractor based on authentication)
export const investmentOpportunityApi = {
  // Create Investment Opportunity (Admin only - with file uploads)
  createOpportunity: async (formData: FormData) => {
    // Use api service to get correct base URL and handle FormData properly
    return api.post("/api/investment/opportunities", formData);
  },

  // Get All Investment Opportunities (Admin sees all, Contractor sees only available)
  getAllOpportunities: async (
    filters: InvestmentOpportunityFilters = {}
  ): Promise<InvestmentOpportunitiesResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    const url = queryString
      ? `/api/investment/opportunities?${queryString}`
      : `/api/investment/opportunities`;
    const response = await api.get(url);
    return {
      data: response.data,
      pagination: (response as any).pagination,
    } as InvestmentOpportunitiesResponse;
  },

  // Get Investment Opportunity by ID (Admin sees any, Contractor sees only available)
  getOpportunityById: async (id: string): Promise<InvestmentOpportunity> => {
    const response = await api.get(`/api/investment/opportunities/${id}`);
    return response.data;
  },

  // Update Investment Opportunity (Admin only - with file uploads)
  updateOpportunity: async (id: string, formData: FormData | any) => {
    // Use api service to get correct base URL and handle FormData properly
    return api.put(`/api/investment/opportunities/${id}`, formData);
  },

  // Update Interest Status (Admin only)
  updateInterestStatus: async (
    opportunityId: string,
    contractorId: string,
    data: { contactStatus: ContactStatus; adminNotes?: string }
  ) => {
    return api.put(
      `/api/investment/opportunities/${opportunityId}/interests/${contractorId}`,
      data
    );
  },

  // Get Investment Statistics (Admin only)
  getStatistics: async (): Promise<InvestmentStatistics> => {
    const response = await api.get("/api/investment/opportunities/statistics");
    console.log("Raw API Response:", response);
    console.log("Response data:", response.data);
    // The API returns { success, data: {...} } and api.get already extracts response.data
    // So response.data is already the data object with statusBreakdown, etc.
    return response.data;
  },

  // Express or Withdraw Interest (Contractor only)
  manageInterest: async (
    id: string,
    action: "express" | "withdraw",
    message?: string
  ) => {
    return api.post(`/api/investment/opportunities/${id}/interest`, {
      action,
      message,
    });
  },

  // Get My Expressed Interests (Contractor only)
  getMyInterests: async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      contactStatus?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{
    success: boolean;
    data: ContractorInvestmentInterest[];
    pagination: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    const { page = 1, limit = 10, status, contactStatus, sortOrder } = params;

    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));
    if (status) queryParams.append("status", status);
    if (contactStatus) queryParams.append("contactStatus", contactStatus);
    if (sortOrder) queryParams.append("sortOrder", sortOrder);

    const response: any = await api.get(
      `/api/investment/opportunities/my-interests?${queryParams.toString()}`
    );

    return {
      success: response.success || true,
      data: response.data,
      pagination: response.pagination,
    };
  },
};
