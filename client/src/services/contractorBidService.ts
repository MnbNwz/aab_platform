import { api } from "./apiService";

export interface BidTimeline {
  startDate: string;
  endDate: string;
}

export interface BidMaterials {
  included: boolean;
  description?: string;
}

export interface BidWarranty {
  period: number; // in years
  description?: string;
}

export interface SubmitBidPayload {
  jobRequestId: string;
  bidAmount: number;
  message: string;
  timeline: BidTimeline;
  materials?: BidMaterials;
  warranty?: BidWarranty;
}

export interface ContractorBid {
  _id: string;
  bidAmount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  timeline: BidTimeline;
  materials?: BidMaterials | string;
  warranty?: BidWarranty | string;
  jobRequest: {
    _id: string;
    title: string;
    description: string;
    service: string;
    estimate: number;
    timeline: number;
    status: string;
    property: {
      _id: string;
      title: string;
      location: {
        type: string;
        coordinates: [number, number];
      };
      area?: number;
      areaUnit?: string;
    };
    location: {
      type: string;
      coordinates: [number, number];
    };
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContractorBidsResponse {
  bids: ContractorBid[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BidFilters {
  status?: "pending" | "accepted" | "rejected" | "all";
  page?: number;
  limit?: number;
}

// Contractor Bid API functions
export const contractorBidApi = {
  // Get contractor's bids
  getMyBids: async (filters: BidFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status);
    }
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    return api.get(`/api/job/bids/contractor?${params.toString()}`);
  },

  // Submit a bid on a job
  submitBid: async (bidData: SubmitBidPayload) => {
    return api.post("/api/job/bids", bidData);
  },
};
