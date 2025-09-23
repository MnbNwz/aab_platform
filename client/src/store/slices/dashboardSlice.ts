import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import {
//   fetchDashboardThunk,
//   silentFetchDashboardThunk,
//   fetchCustomerDashboardThunk,
//   fetchContractorDashboardThunk,
//   fetchPlatformDashboardThunk,
//   silentFetchCustomerDashboardThunk,
//   silentFetchContractorDashboardThunk,
//   silentFetchPlatformDashboardThunk,
// } from "../thunks/dashboardThunks";

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
import type {
  CustomerDashboardResponse,
  ContractorDashboardResponse,
  PlatformDashboardResponse,
} from "../../services/dashboardService";

export interface DashboardState {
  // Unified Dashboard Data (role-based response from single endpoint)
  data: any | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;

  // Legacy role-specific data (for backward compatibility)
  customerData: CustomerDashboardResponse["data"] | null;
  customerLoading: boolean;
  customerError: string | null;
  customerLastFetched: string | null;

  // Contractor Dashboard Data
  contractorData: ContractorDashboardResponse["data"] | null;
  contractorLoading: boolean;
  contractorError: string | null;
  contractorLastFetched: string | null;

  // Platform Dashboard Data (Admin)
  platformData: PlatformDashboardResponse["data"] | null;
  platformLoading: boolean;
  platformError: string | null;
  platformLastFetched: string | null;

  // UI State
  refreshInterval: number; // in milliseconds
  autoRefreshEnabled: boolean;
}

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
        // Extract data from API response structure: { success: true, data: {...} }
        state.data = action.payload?.data || action.payload;
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
        // Extract data from API response structure: { success: true, data: {...} }
        state.data = action.payload?.data || action.payload;
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
      );
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
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
