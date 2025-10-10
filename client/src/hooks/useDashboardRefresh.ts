import { useCallback } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store";
import { fetchDashboardThunk } from "../store/thunks/dashboardThunks";
import { fetchInvestmentStatisticsThunk } from "../store/slices/investmentOpportunitySlice";

export const useDashboardRefresh = (
  userRole: "customer" | "contractor" | "admin"
) => {
  const dispatch = useDispatch<AppDispatch>();

  // Manual refresh function - only called on button click (with toast)
  const manualRefresh = useCallback(() => {
    // Use unified dashboard thunk for all roles
    dispatch(fetchDashboardThunk({ showToast: true }));

    // Fetch investment statistics in parallel for admin users
    if (userRole === "admin") {
      dispatch(fetchInvestmentStatisticsThunk());
    }
  }, [dispatch, userRole]);

  return { manualRefresh };
};
