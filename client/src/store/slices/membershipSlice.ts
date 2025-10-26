import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { membershipService } from "../../services/membershipService";
import type { MembershipPlan, CurrentMembership } from "../../types";

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

interface MembershipState {
  current: CurrentMembership | null;
  plans: MembershipPlan[];
  loading: boolean;
  error: string | null;
}

const membershipSlice = createSlice({
  name: "membership",
  initialState: {
    current: null,
    plans: [],
    loading: false,
    error: null,
  } as MembershipState,
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
        if (
          action.payload &&
          typeof action.payload === "object" &&
          "success" in action.payload
        ) {
          state.current = (action.payload as any).data;
        } else {
          state.current = action.payload;
        }
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
