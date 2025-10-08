import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  contractorBidApi,
  type BidFilters,
  type SubmitBidPayload,
} from "../../services/contractorBidService";

// Get contractor's bids
export const getMyBidsThunk = createAsyncThunk(
  "contractorBids/getMyBids",
  async (filters: BidFilters = {}, { rejectWithValue }) => {
    try {
      const response = await contractorBidApi.getMyBids(filters);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch bids";
      return rejectWithValue(errorMessage);
    }
  }
);

// Submit a bid
export const submitBidThunk = createAsyncThunk(
  "contractorBids/submitBid",
  async (bidData: SubmitBidPayload, { rejectWithValue }) => {
    try {
      const response = await contractorBidApi.submitBid(bidData);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to submit bid";
      return rejectWithValue(errorMessage);
    }
  }
);
