import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { membershipService } from "../../services/membershipService";

export const fetchCurrentMembership = createAsyncThunk(
  "membership/fetchCurrentMembership",
  async (_, { rejectWithValue }) => {
    try {
      const res = await membershipService.getCurrent();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch membership");
    }
  }
);

export const fetchMembershipPlans = createAsyncThunk(
  "membership/fetchMembershipPlans",
  async (
    userType: "customer" | "contractor" | "admin",
    { rejectWithValue }
  ) => {
    try {
      const res = await membershipService.getPlans(userType);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch plans");
    }
  }
);

const membershipSlice = createSlice({
  name: "membership",
  initialState: {
    current: null,
    plans: [],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    clearMembershipError(state) {
      state.error = null;
    },
    resetMembership(state) {
      state.current = null;
      state.plans = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentMembership.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentMembership.fulfilled, (state, action) => {
        state.current = action.payload.data || null;
        state.loading = false;
      })
      .addCase(fetchCurrentMembership.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMembershipPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembershipPlans.fulfilled, (state, action) => {
        state.plans = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchMembershipPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMembershipError, resetMembership } =
  membershipSlice.actions;
export default membershipSlice.reducer;
