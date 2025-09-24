import { api } from "./apiService";

// Dashboard Response Types based on API documentation
export interface CustomerDashboardResponse {
  success: boolean;
  data: {
    customerId: string;
    analytics: {
      jobStats: {
        totalJobs: number;
        openJobs: number;
        completedJobs: number;
        totalValue: number;
        avgJobValue: number;
        totalBids: number;
        avgBidsPerJob: number;
      };
      paymentStats: {
        totalPayments: number;
        totalAmount: number;
        successfulPayments: number;
        avgPaymentAmount: number;
      };
      propertyStats: {
        totalProperties: number;
        totalJobsAcrossProperties: number;
        avgJobsPerProperty: number;
      };
      recentJobs: Array<{
        _id: string;
        title: string;
        status: string;
        estimate: number;
        bidCount: number;
        avgBidAmount?: number;
        property: {
          title: string;
          propertyType: string;
        };
        createdAt: string;
      }>;
      recentPayments: Array<{
        _id: string;
        amount: number;
        status: string;
        paymentMethod: string;
        job?: {
          title: string;
          service: string;
        };
        createdAt: string;
      }>;
      recentProperties: Array<{
        _id: string;
        title: string;
        propertyType: string;
        address: string;
        totalJobs: number;
        createdAt: string;
      }>;
    };
    timestamp: string;
    description: string;
  };
}

export interface ContractorDashboardResponse {
  success: boolean;
  data: {
    userRole: string;
    userId: string;
    timestamp: string;
    contractor: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      contractor: {
        companyName: string;
        services: string[];
        license: string;
        taxId: string;
        docs: Array<{
          name: string;
          url: string;
        }>;
        _id: string;
      };
      biddingStats: {
        totalBids: number;
        acceptedBids: number;
        pendingBids: number;
        rejectedBids: number;
        avgBidAmount: number | null;
        winRate: number;
      };
      earningsStats: {
        totalEarnings: number;
        completedJobs: number;
        avgJobValue: number | null;
        totalJobValue: number;
      };
      leadStats: {
        monthlyUsed: any[]; // Can be array or number
        membershipTier: any[];
        monthlyLimit: number;
        monthlyRemaining: number;
      };
      recentBids: any[];
      recentWonJobs: any[];
    };
    description: string;
    isContractor: boolean;
  };
}

export interface PlatformDashboardResponse {
  success: boolean;
  data: {
    userRole: string;
    userId: string;
    timestamp: string;
    platform: {
      users: {
        roles: Array<{
          role: string;
          count: number;
          approved: number;
          pending: number;
          rejected: number;
        }>;
        totalUsers: number;
        totalApproved: number;
        totalPending: number;
        totalRejected: number;
      };
      jobs: {
        totalJobs: number;
        openJobs: number;
        inProgressJobs: number;
        completedJobs: number;
        cancelledJobs: number;
        totalValue: number;
        avgJobValue: number;
        monthlyJobs: Array<{
          month: number;
          year: number;
          status: "open" | "inprogress" | "completed" | "cancelled";
          value: number;
        }>;
        serviceBreakdown: Array<{
          service: string;
          estimate: number;
          status: string;
        }>;
      };
      memberships: {
        membershipBreakdown: Array<{
          status: string;
          count: number;
          totalRevenue: number;
        }>;
        totalMemberships: number;
        totalRevenue: number;
      };
    };
    summary: {
      healthScore: number;
    };
    period: {
      current: {
        month: number;
        year: number;
      };
      description: string;
    };
    description: string;
    isAdmin: boolean;
  };
}

// Unified Dashboard Response Type (backend returns role-appropriate data)
export type UnifiedDashboardResponse =
  | CustomerDashboardResponse
  | ContractorDashboardResponse
  | PlatformDashboardResponse;

// Unified Dashboard API - single endpoint for all users
export const dashboardApi = {
  // Unified Dashboard (returns role-appropriate data based on authenticated user)
  getDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard");
    return response.data;
  },

  // Legacy methods for backward compatibility (all point to unified endpoint)
  getCustomerDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard");
    return response.data;
  },

  getContractorDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard");
    return response.data;
  },

  getPlatformDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard");
    return response.data;
  },
} as const;
