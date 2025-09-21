import { createAsyncThunk } from "@reduxjs/toolkit";
import { dashboardApi } from "../../services/dashboardService";
import type {
  CustomerDashboardResponse,
  ContractorDashboardResponse,
  PlatformDashboardResponse,
} from "../../services/dashboardService";
import { showToast } from "../../utils/toast";

// Unified Dashboard Thunk (for all user roles)
export const fetchDashboardThunk = createAsyncThunk<
  any,
  { showToast?: boolean },
  { rejectValue: string }
>(
  "dashboard/fetchDashboard",
  async ({ showToast: showToastNotification = true }, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getDashboard();
      if (showToastNotification) {
        showToast.success("Dashboard data loaded successfully");
      }
      return data;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch dashboard data";
      if (showToastNotification) {
        showToast.error(`Failed to load dashboard: ${errorMessage}`);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Silent Dashboard Thunk (for auto-refresh without toasts)
export const silentFetchDashboardThunk = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("dashboard/silentFetchDashboard", async (_, { rejectWithValue }) => {
  try {
    const data = await dashboardApi.getDashboard();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || "Failed to fetch dashboard data";
    // Only show error toast for failed auto-refresh
    showToast.error("Dashboard auto-refresh failed");
    return rejectWithValue(errorMessage);
  }
});

// Legacy thunks for backward compatibility (all use unified endpoint now)
export const fetchCustomerDashboardThunk = createAsyncThunk<
  CustomerDashboardResponse["data"],
  { showToast?: boolean },
  { rejectValue: string }
>(
  "dashboard/fetchCustomerDashboard",
  async ({ showToast: showToastNotification = true }, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getCustomerDashboard();
      if (showToastNotification) {
        showToast.success("Dashboard data loaded successfully");
      }
      return data;
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to fetch customer dashboard";
      if (showToastNotification) {
        showToast.error(`Failed to load dashboard: ${errorMessage}`);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchContractorDashboardThunk = createAsyncThunk<
  ContractorDashboardResponse["data"],
  { showToast?: boolean },
  { rejectValue: string }
>(
  "dashboard/fetchContractorDashboard",
  async ({ showToast: showToastNotification = true }, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getContractorDashboard();
      if (showToastNotification) {
        showToast.success("Dashboard data loaded successfully");
      }
      return data;
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to fetch contractor dashboard";
      if (showToastNotification) {
        showToast.error(`Failed to load dashboard: ${errorMessage}`);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchPlatformDashboardThunk = createAsyncThunk<
  PlatformDashboardResponse["data"],
  { showToast?: boolean },
  { rejectValue: string }
>(
  "dashboard/fetchPlatformDashboard",
  async ({ showToast: showToastNotification = true }, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getPlatformDashboard();
      if (showToastNotification) {
        showToast.success("Platform analytics loaded successfully");
      }
      return data;
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to fetch platform dashboard";
      if (showToastNotification) {
        showToast.error(`Failed to load platform analytics: ${errorMessage}`);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Legacy silent thunks for backward compatibility
export const silentFetchCustomerDashboardThunk = createAsyncThunk<
  CustomerDashboardResponse["data"],
  void,
  { rejectValue: string }
>("dashboard/silentFetchCustomerDashboard", async (_, { rejectWithValue }) => {
  try {
    const data = await dashboardApi.getCustomerDashboard();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || "Failed to fetch customer dashboard";
    showToast.error("Dashboard auto-refresh failed");
    return rejectWithValue(errorMessage);
  }
});

export const silentFetchContractorDashboardThunk = createAsyncThunk<
  ContractorDashboardResponse["data"],
  void,
  { rejectValue: string }
>(
  "dashboard/silentFetchContractorDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getContractorDashboard();
      return data;
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to fetch contractor dashboard";
      showToast.error("Dashboard auto-refresh failed");
      return rejectWithValue(errorMessage);
    }
  }
);

export const silentFetchPlatformDashboardThunk = createAsyncThunk<
  PlatformDashboardResponse["data"],
  void,
  { rejectValue: string }
>("dashboard/silentFetchPlatformDashboard", async (_, { rejectWithValue }) => {
  try {
    const data = await dashboardApi.getPlatformDashboard();
    return data;
  } catch (error: any) {
    const errorMessage = error.message || "Failed to fetch platform dashboard";
    showToast.error("Platform auto-refresh failed");
    return rejectWithValue(errorMessage);
  }
});
