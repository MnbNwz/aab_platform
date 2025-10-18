import { createSlice } from "@reduxjs/toolkit";
import { getMyBidsThunk, submitBidThunk } from "../thunks/contractorBidsThunks";
import type { ContractorBid } from "../../services/contractorBidService";

export interface BidFilters {
  status: "pending" | "accepted" | "rejected" | "all";
  page: number;
  limit: number;
}

export interface ContractorBidsState {
  bids: ContractorBid[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    total: number;
  };
  filters: BidFilters;
}

const initialState: ContractorBidsState = {
  bids: [],
  loading: false,
  submitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  },
  filters: {
    status: "all",
    page: 1,
    limit: 10,
  },
};

const contractorBidsSlice = createSlice({
  name: "contractorBids",
  initialState,
  reducers: {
    setBidFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearBidsError: (state) => {
      state.error = null;
    },
    resetBids: (state) => {
      state.bids = [];
      state.pagination = initialState.pagination;
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get My Bids
      .addCase(getMyBidsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyBidsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.bids = action.payload.bids || [];
        state.pagination = {
          ...action.payload.pagination,
          total: action.payload.total,
        };
      })
      .addCase(getMyBidsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Submit Bid
      .addCase(submitBidThunk.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitBidThunk.fulfilled, (state) => {
        state.submitting = false;
        state.error = null;
        // Note: We don't add the bid to the list here because the backend
        // returns unpopulated bid data. The dashboard stats are updated
        // via cross-slice listener in dashboardSlice. User can refresh
        // the My Bids page to see the new bid with full details.
      })
      .addCase(submitBidThunk.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { setBidFilters, clearBidsError, resetBids } =
  contractorBidsSlice.actions;

export default contractorBidsSlice.reducer;
