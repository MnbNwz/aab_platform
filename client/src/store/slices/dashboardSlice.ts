import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  silentFetchPlatformDashboardThunk,
  fetchDashboardThunk,
  silentFetchDashboardThunk,
  fetchCustomerDashboardThunk,
  fetchContractorDashboardThunk,
  fetchPlatformDashboardThunk,
  silentFetchCustomerDashboardThunk,
  silentFetchContractorDashboardThunk,
} from "../thunks/dashboardThunks";
import { submitBidThunk } from "../thunks/contractorBidsThunks";
import type {
  DashboardState,
  LeadStatsUpdate,
  RecentBidData,
} from "../../types/dashboard";

const initialState: DashboardState = {
  // Unified Dashboard
  data: null,
  loading: false,
  error: null,
  lastFetched: null,

  // Legacy Customer Dashboard
  customerData: null,
  customerLoading: false,
  customerError: null,
  customerLastFetched: null,

  // Contractor Dashboard
  contractorData: null,
  contractorLoading: false,
  contractorError: null,
  contractorLastFetched: null,

  // Platform Dashboard
  platformData: null,
  platformLoading: false,
  platformError: null,
  platformLastFetched: null,

  // UI State
  refreshInterval: 3 * 60 * 1000, // 3 minutes default
  autoRefreshEnabled: true,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    // Clear specific dashboard data
    clearCustomerDashboard: (state) => {
      state.customerData = null;
      state.customerError = null;
      state.customerLastFetched = null;
    },
    clearContractorDashboard: (state) => {
      state.contractorData = null;
      state.contractorError = null;
      state.contractorLastFetched = null;
    },
    clearPlatformDashboard: (state) => {
      state.platformData = null;
      state.platformError = null;
      state.platformLastFetched = null;
    },

    // Clear all dashboard data (useful for logout)
    clearAllDashboards: (state) => {
      state.customerData = null;
      state.customerError = null;
      state.customerLastFetched = null;
      state.contractorData = null;
      state.contractorError = null;
      state.contractorLastFetched = null;
      state.platformData = null;
      state.platformError = null;
      state.platformLastFetched = null;
    },

    // Update refresh settings
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },
    setAutoRefreshEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshEnabled = action.payload;
    },

    // Manual error clearing
    clearError: (state) => {
      state.error = null;
    },
    clearCustomerError: (state) => {
      state.customerError = null;
    },
    clearContractorError: (state) => {
      state.contractorError = null;
    },
    clearPlatformError: (state) => {
      state.platformError = null;
    },

    // Update contractor lead stats after successful bid
    updateContractorLeadStats: (
      state,
      action: PayloadAction<LeadStatsUpdate>
    ) => {
      if (state.contractorData?.contractor?.leadStats) {
        state.contractorData.contractor.leadStats.used =
          action.payload.leadsUsed;
        state.contractorData.contractor.leadStats.remaining =
          action.payload.remaining;
        state.contractorData.contractor.leadStats.limit =
          action.payload.leadsLimit;
        state.contractorData.contractor.leadStats.canBid =
          action.payload.remaining > 0;
      }
      // Also update unified data if it exists
      if (state.data?.leadStats) {
        state.data.leadStats.used = action.payload.leadsUsed;
        state.data.leadStats.remaining = action.payload.remaining;
        state.data.leadStats.limit = action.payload.leadsLimit;
        state.data.leadStats.canBid = action.payload.remaining > 0;
      }
    },

    // Add a new bid to recent bids list
    addRecentBid: (state, action: PayloadAction<RecentBidData>) => {
      const newBid = {
        _id: action.payload.bidId,
        jobTitle: action.payload.jobTitle,
        service: action.payload.service,
        bidAmount: action.payload.bidAmount,
        status: action.payload.status as "pending" | "accepted" | "rejected",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to contractor data recent bids
      if (state.contractorData?.contractor?.recentBids) {
        state.contractorData.contractor.recentBids = [
          newBid,
          ...state.contractorData.contractor.recentBids.slice(0, 9), // Keep only 10 most recent
        ];
      } else if (state.contractorData?.contractor) {
        state.contractorData.contractor.recentBids = [newBid];
      }

      // Add to unified data recent bids
      if (state.data?.recentBids) {
        state.data.recentBids = [
          newBid,
          ...state.data.recentBids.slice(0, 9), // Keep only 10 most recent
        ];
      } else if (state.data) {
        state.data.recentBids = [newBid];
      }
    },
  },
  extraReducers: (builder) => {
    // Unified Dashboard Thunks
    builder
      .addCase(fetchDashboardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response structure for contractor
        const payload = action.payload;

        // For contractor role, extract and store the contractor data
        if (payload?.userRole === "contractor" && payload?.contractor) {
          state.data = payload.contractor;
          state.contractorData = payload; // Store full payload including contractor
        } else {
          // For other roles or legacy format, use existing logic
          state.data = payload?.data || payload;
        }

        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch dashboard data";
      })
      .addCase(silentFetchDashboardThunk.pending, (_state) => {
        // Silent refresh doesn't show loading state
      })
      .addCase(silentFetchDashboardThunk.fulfilled, (state, action) => {
        // Handle new API response structure for contractor
        const payload = action.payload;

        // For contractor role, extract the contractor data directly
        if (payload?.userRole === "contractor" && payload?.contractor) {
          state.data = payload.contractor;
        } else {
          // For other roles or legacy format, use existing logic
          state.data = payload?.data || payload;
        }

        state.lastFetched = new Date().toISOString();
      })
      .addCase(silentFetchDashboardThunk.rejected, (_state, _action) => {
        // Silent errors don't update error state to avoid disrupting UI
      })

      // Legacy Customer Dashboard Thunks
      .addCase(fetchCustomerDashboardThunk.pending, (state) => {
        state.customerLoading = true;
        state.customerError = null;
      })
      .addCase(fetchCustomerDashboardThunk.fulfilled, (state, action) => {
        state.customerLoading = false;
        state.customerData = action.payload;
        state.customerError = null;
        state.customerLastFetched = new Date().toISOString();
        // Also update unified data for consistency
        state.data = action.payload as any;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchCustomerDashboardThunk.rejected, (state, action) => {
        state.customerLoading = false;
        state.customerError =
          (action.payload as string) || "Failed to fetch customer dashboard";
      })

      // Contractor Dashboard Thunks
      .addCase(fetchContractorDashboardThunk.pending, (state) => {
        state.contractorLoading = true;
        state.contractorError = null;
      })
      .addCase(fetchContractorDashboardThunk.fulfilled, (state, action) => {
        state.contractorLoading = false;
        state.contractorData = action.payload;
        state.contractorError = null;
        state.contractorLastFetched = new Date().toISOString();
        // Also update unified data for consistency
        state.data = action.payload as any;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchContractorDashboardThunk.rejected, (state, action) => {
        state.contractorLoading = false;
        state.contractorError =
          (action.payload as string) || "Failed to fetch contractor dashboard";
      })

      // Platform Dashboard Thunks
      .addCase(fetchPlatformDashboardThunk.pending, (state) => {
        state.platformLoading = true;
        state.platformError = null;
      })
      .addCase(fetchPlatformDashboardThunk.fulfilled, (state, action) => {
        state.platformLoading = false;
        state.platformData =
          (action.payload as any)?.data || (action.payload as any);
        state.platformError = null;
        state.platformLastFetched = new Date().toISOString();
        // Also update unified data for consistency
        state.data = (action.payload as any)?.data || (action.payload as any);
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchPlatformDashboardThunk.rejected, (state, action) => {
        state.platformLoading = false;
        state.platformError =
          (action.payload as string) || "Failed to fetch platform dashboard";
      })

      // Silent Dashboard Thunks (for auto-refresh)
      .addCase(silentFetchCustomerDashboardThunk.pending, (_state) => {
        // Don't set loading state for silent refresh
      })
      .addCase(silentFetchCustomerDashboardThunk.fulfilled, (state, action) => {
        state.customerData = action.payload;
        state.customerError = null;
        state.customerLastFetched = new Date().toISOString();
      })
      .addCase(
        silentFetchCustomerDashboardThunk.rejected,
        (_state, _action) => {
          // Don't update error state for silent refresh failures
        }
      )

      .addCase(silentFetchContractorDashboardThunk.pending, (_state) => {
        // Don't set loading state for silent refresh
      })
      .addCase(
        silentFetchContractorDashboardThunk.fulfilled,
        (state, action) => {
          state.contractorData = action.payload;
          state.contractorError = null;
          state.contractorLastFetched = new Date().toISOString();
        }
      )
      .addCase(
        silentFetchContractorDashboardThunk.rejected,
        (_state, _action) => {
          // Don't update error state for silent refresh failures
        }
      )

      .addCase(silentFetchPlatformDashboardThunk.pending, (_state) => {
        // Don't set loading state for silent refresh
      })
      .addCase(silentFetchPlatformDashboardThunk.fulfilled, (state, action) => {
        state.platformData =
          (action.payload as any)?.data || (action.payload as any);
        state.platformError = null;
        state.platformLastFetched = new Date().toISOString();
      })
      .addCase(
        silentFetchPlatformDashboardThunk.rejected,
        (_state, _action) => {
          // Don't update error state for silent refresh failures
        }
      )

      // Cross-slice: Listen to bid submission to update lead stats and bid counts
      .addCase(submitBidThunk.fulfilled, (state, action) => {
        const leadInfo = action.payload?.leadInfo;

        if (!leadInfo) return;

        // Helper to update lead stats in a given object
        const updateLeadStats = (target: any) => {
          if (!target?.leadStats) return;
          target.leadStats.used = leadInfo.leadsUsed;
          target.leadStats.remaining = leadInfo.remaining ?? 0;
          target.leadStats.limit = leadInfo.leadsLimit;
          target.leadStats.canBid = leadInfo.canAccess;
        };

        // Helper to update bidding stats in a given object
        const updateBiddingStats = (target: any) => {
          if (!target?.biddingStats) return;
          const stats = target.biddingStats;
          stats.totalBids = (stats.totalBids || 0) + 1;
          stats.totalBidsThisMonth = (stats.totalBidsThisMonth || 0) + 1;

          // Recalculate win rate
          const acceptedBids = stats.acceptedBids || 0;
          const totalBids = stats.totalBids;
          stats.winRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;
        };

        // Update both data structures (contractor dashboard and unified data)
        updateLeadStats(state.contractorData?.contractor);
        updateLeadStats(state.data);
        updateBiddingStats(state.contractorData?.contractor);
        updateBiddingStats(state.data);
      });
  },
});

export const {
  clearCustomerDashboard,
  clearContractorDashboard,
  clearPlatformDashboard,
  clearAllDashboards,
  setRefreshInterval,
  setAutoRefreshEnabled,
  clearCustomerError,
  clearContractorError,
  clearPlatformError,
  updateContractorLeadStats,
  addRecentBid,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
