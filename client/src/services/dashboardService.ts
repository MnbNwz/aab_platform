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
    contractorId: string;
    analytics: {
      biddingStats: {
        totalBids: number;
        acceptedBids: number;
        pendingBids: number;
        rejectedBids: number;
        winRate: number;
        avgBidAmount: number;
      };
      earningsStats: {
        totalEarnings: number;
        completedJobs: number;
        avgJobValue: number;
        totalJobValue: number;
      };
      leadStats: {
        monthlyUsed: number;
        monthlyLimit: number;
        monthlyRemaining: number;
      };
      recentBids: Array<{
        _id: string;
        bidAmount: number;
        status: string;
        message: string;
        job: {
          title: string;
          service: string;
          estimate: number;
          status: string;
        };
        createdAt: string;
      }>;
      recentWonJobs: Array<{
        _id: string;
        title: string;
        service: string;
        estimate: number;
        status: string;
        acceptedBid: {
          bidAmount: number;
        };
        createdAt: string;
      }>;
    };
    timestamp: string;
    description: string;
  };
}

export interface PlatformDashboardResponse {
  success: boolean;
  data: {
    platform: {
      jobs: {
        totalJobs: number;
        openJobs: number;
        inProgressJobs: number;
        completedJobs: number;
        cancelledJobs: number;
        totalValue: number;
        avgJobValue: number;
        totalBids: number;
        avgBidsPerJob: number;
        monthlyJobs: Array<{
          month: number;
          year: number;
          status: string;
          value: number;
        }>;
        serviceBreakdown: Array<{
          service: string;
          estimate: number;
          status: string;
        }>;
      };
      users: {
        totalUsers: number;
        totalApproved: number;
        totalPending: number;
        totalRejected: number;
        roles: Array<{
          role: string;
          count: number;
          approved: number;
          pending: number;
          rejected: number;
          monthlyRegistrations: Array<{
            month: number;
            year: number;
            approval: string;
          }>;
        }>;
      };
      payments: {
        totalPayments: number;
        totalAmount: number;
        successfulPayments: number;
        failedPayments: number;
        pendingPayments: number;
        avgPaymentAmount: number;
        monthlyRevenue: Array<{
          month: number;
          year: number;
          amount: number;
          status: string;
        }>;
        paymentMethods: Array<{
          method: string;
          amount: number;
          status: string;
        }>;
      };
      memberships: {
        totalMemberships: number;
        totalRevenue: number;
        membershipBreakdown: Array<{
          planName: string;
          tier: string;
          status: string;
          count: number;
          totalRevenue: number;
          avgDuration: number;
          monthlySubscriptions: Array<{
            month: number;
            year: number;
            price: number;
            status: string;
          }>;
        }>;
      };
      bids: {
        totalBids: number;
        acceptedBids: number;
        pendingBids: number;
        rejectedBids: number;
        avgBidAmount: number;
        totalBidValue: number;
        serviceBids: Array<{
          service: string;
          bidAmount: number;
          status: string;
        }>;
        monthlyBids: Array<{
          month: number;
          year: number;
          amount: number;
          status: string;
        }>;
      };
      recentActivity: Array<{
        type:
          | "user_registration"
          | "bid_placed"
          | "payment_processed"
          | "job_created";
        createdAt: string;
        email?: string;
        role?: string;
        bidAmount?: number;
        status?: string;
        amount?: number;
      }>;
    };
    summary: {
      totalJobs: number;
      totalUsers: number;
      totalRevenue: number;
      totalMemberships: number;
      healthScore: number;
    };
    period: {
      current: {
        month: number;
        year: number;
      };
      description: string;
    };
    timestamp: string;
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
    const response = await api.get<any>("/api/dashboard/platform");
    return response.data;
  },

  // Legacy methods for backward compatibility (all point to unified endpoint)
  getCustomerDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard/platform");
    return response.data;
  },

  getContractorDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard/platform");
    return response.data;
  },

  getPlatformDashboard: async (): Promise<any> => {
    const response = await api.get<any>("/api/dashboard/platform");
    return response.data;
  },
} as const;
