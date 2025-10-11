import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { investmentOpportunityApi } from "../../services/investmentOpportunityService";
import type {
  InvestmentOpportunity,
  InvestmentOpportunityFilters,
  ContractorInvestmentInterest,
  InvestmentStatistics,
  ContactStatus,
} from "../../types";
import { showToast } from "../../utils/toast";

// Unified Thunks (work for both Admin and Contractor based on authentication)
export const fetchInvestmentOpportunitiesThunk = createAsyncThunk(
  "investmentOpportunity/fetchAll",
  async (filters: InvestmentOpportunityFilters, { rejectWithValue }) => {
    try {
      const response = await investmentOpportunityApi.getAllOpportunities(
        filters
      );
      return response;
    } catch (error: any) {
      showToast.error(
        error.message || "Failed to fetch investment opportunities"
      );
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInvestmentOpportunityByIdThunk = createAsyncThunk(
  "investmentOpportunity/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await investmentOpportunityApi.getOpportunityById(id);
      return response;
    } catch (error: any) {
      showToast.error(
        error.message || "Failed to fetch investment opportunity"
      );
      return rejectWithValue(error.message);
    }
  }
);

export const createInvestmentOpportunityThunk = createAsyncThunk(
  "investmentOpportunity/create",
  async (opportunityData: FormData | any, { rejectWithValue }) => {
    try {
      const response = await investmentOpportunityApi.createOpportunity(
        opportunityData
      );
      showToast.success("Investment opportunity created successfully");
      // Return the newly created opportunity
      return response.data;
    } catch (error: any) {
      showToast.error(
        error.message || "Failed to create investment opportunity"
      );
      return rejectWithValue(error.message);
    }
  }
);

export const updateInvestmentOpportunityThunk = createAsyncThunk(
  "investmentOpportunity/update",
  async (
    {
      id,
      updateData,
    }: { id: string; updateData: FormData | Partial<InvestmentOpportunity> },
    { rejectWithValue }
  ) => {
    try {
      const response = await investmentOpportunityApi.updateOpportunity(
        id,
        updateData
      );
      showToast.success("Investment opportunity updated successfully");
      // Return the updated opportunity with its ID
      return { id, data: response.data };
    } catch (error: any) {
      showToast.error(
        error.message || "Failed to update investment opportunity"
      );
      return rejectWithValue(error.message);
    }
  }
);

export const updateInterestStatusThunk = createAsyncThunk(
  "investmentOpportunity/updateInterestStatus",
  async (
    {
      opportunityId,
      contractorId,
      data,
    }: {
      opportunityId: string;
      contractorId: string;
      data: { contactStatus: ContactStatus; adminNotes?: string };
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await investmentOpportunityApi.updateInterestStatus(
        opportunityId,
        contractorId,
        data
      );
      showToast.success("Interest status updated successfully");
      // Refresh the opportunity details
      dispatch(fetchInvestmentOpportunityByIdThunk(opportunityId));
      return response.data;
    } catch (error: any) {
      showToast.error(error.message || "Failed to update interest status");
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInvestmentStatisticsThunk = createAsyncThunk(
  "investmentOpportunity/fetchStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await investmentOpportunityApi.getStatistics();
      return response;
    } catch (error: any) {
      showToast.error(error.message || "Failed to fetch statistics");
      return rejectWithValue(error.message);
    }
  }
);

export const expressInterestThunk = createAsyncThunk(
  "investmentOpportunity/expressInterest",
  async (
    { id, message }: { id: string; message?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await investmentOpportunityApi.manageInterest(
        id,
        "express",
        message
      );
      showToast.success("Interest expressed successfully");
      return { id, message, data: response.data };
    } catch (error: any) {
      showToast.error(error.message || "Failed to express interest");
      return rejectWithValue(error.message);
    }
  }
);

export const withdrawInterestThunk = createAsyncThunk(
  "investmentOpportunity/withdrawInterest",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await investmentOpportunityApi.manageInterest(
        id,
        "withdraw"
      );
      showToast.success("Interest withdrawn successfully");
      return { id, data: response.data };
    } catch (error: any) {
      showToast.error(error.message || "Failed to withdraw interest");
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyInterestsThunk = createAsyncThunk(
  "investmentOpportunity/fetchMyInterests",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      contactStatus?: string;
      sortOrder?: "asc" | "desc";
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await investmentOpportunityApi.getMyInterests(params);
      return response;
    } catch (error: any) {
      showToast.error(error.message || "Failed to fetch interests");
      return rejectWithValue(error.message);
    }
  }
);

// State Interface
interface InvestmentOpportunityState {
  opportunities: InvestmentOpportunity[];
  selectedOpportunity: InvestmentOpportunity | null;
  myInterests: ContractorInvestmentInterest[];
  statistics: InvestmentStatistics | null;
  loading: boolean;
  detailsLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  error: string | null;
  filters: InvestmentOpportunityFilters;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  interestsPagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const initialState: InvestmentOpportunityState = {
  opportunities: [],
  selectedOpportunity: null,
  myInterests: [],
  statistics: null,
  loading: false,
  detailsLoading: false,
  createLoading: false,
  updateLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
  },
  pagination: {
    total: 0,
    page: 1,
    pages: 0,
    limit: 10,
  },
  interestsPagination: {
    total: 0,
    page: 1,
    pages: 0,
    limit: 10,
  },
};

const investmentOpportunitySlice = createSlice({
  name: "investmentOpportunity",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<InvestmentOpportunityFilters>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { page: 1, limit: 10 };
    },
    clearSelectedOpportunity: (state) => {
      state.selectedOpportunity = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateOpportunityStatus: (
      state,
      action: PayloadAction<InvestmentOpportunity>
    ) => {
      // Update selectedOpportunity
      state.selectedOpportunity = action.payload;

      // Also update in opportunities list if present
      const index = state.opportunities.findIndex(
        (opp) => opp._id === action.payload._id
      );
      if (index !== -1) {
        state.opportunities[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Opportunities (works for both Admin and Contractor)
      .addCase(fetchInvestmentOpportunitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvestmentOpportunitiesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInvestmentOpportunitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Opportunity by ID (works for both Admin and Contractor)
      .addCase(fetchInvestmentOpportunityByIdThunk.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchInvestmentOpportunityByIdThunk.fulfilled,
        (state, action) => {
          state.detailsLoading = false;
          state.selectedOpportunity = action.payload;
        }
      )
      .addCase(
        fetchInvestmentOpportunityByIdThunk.rejected,
        (state, action) => {
          state.detailsLoading = false;
          state.error = action.payload as string;
        }
      )
      // Create Opportunity (Admin only)
      .addCase(createInvestmentOpportunityThunk.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createInvestmentOpportunityThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        // Add the new opportunity to the beginning of the list
        if (action.payload) {
          state.opportunities.unshift(action.payload);
          state.pagination.total += 1;
        }
      })
      .addCase(createInvestmentOpportunityThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      // Update Opportunity (Admin only)
      .addCase(updateInvestmentOpportunityThunk.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateInvestmentOpportunityThunk.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Update the opportunity in-place in the list
        const index = state.opportunities.findIndex(
          (opp) => opp._id === action.payload.id
        );
        if (index !== -1 && action.payload.data) {
          state.opportunities[index] = action.payload.data;
        }
        // Also update selectedOpportunity if it's the same one
        if (
          state.selectedOpportunity?._id === action.payload.id &&
          action.payload.data
        ) {
          state.selectedOpportunity = action.payload.data;
        }
      })
      .addCase(updateInvestmentOpportunityThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Statistics (Admin only)
      .addCase(fetchInvestmentStatisticsThunk.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })
      // Fetch My Interests (Contractor only)
      .addCase(fetchMyInterestsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyInterestsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.myInterests = action.payload.data;
        state.interestsPagination = action.payload.pagination;
      })
      .addCase(fetchMyInterestsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Express Interest (Contractor only)
      .addCase(expressInterestThunk.fulfilled, (state, action) => {
        const opportunityId = action.payload.id;

        // Find and remove the opportunity from the opportunities list
        const opportunityIndex = state.opportunities.findIndex(
          (opp) => opp._id === opportunityId
        );

        if (opportunityIndex !== -1) {
          const opportunity = state.opportunities[opportunityIndex];

          // Remove from opportunities list
          state.opportunities.splice(opportunityIndex, 1);
          state.pagination.total = Math.max(0, state.pagination.total - 1);

          // Add to myInterests list
          const newInterest = {
            opportunityId: opportunity._id,
            title: opportunity.title,
            propertyType: opportunity.propertyType,
            location: opportunity.location,
            askingPrice: opportunity.askingPrice,
            projectedROI: opportunity.projectedROI,
            totalInvestment: opportunity.totalInvestment,
            status: opportunity.status,
            photos: opportunity.photos,
            interest: {
              expressedAt: new Date().toISOString(),
              message: action.payload.message,
              contactStatus: "pending" as const,
            },
          };

          // Add to beginning of myInterests
          state.myInterests.unshift(newInterest);
          state.interestsPagination.total += 1;
        }

        // Update selectedOpportunity if it matches
        if (state.selectedOpportunity?._id === opportunityId) {
          state.selectedOpportunity.hasExpressedInterest = true;
        }
      })
      // Withdraw Interest (Contractor only)
      .addCase(withdrawInterestThunk.fulfilled, (state, action) => {
        const opportunityId = action.payload.id;

        // Find and remove from myInterests list
        const interestIndex = state.myInterests.findIndex(
          (interest) => interest.opportunityId === opportunityId
        );

        if (interestIndex !== -1) {
          const interest = state.myInterests[interestIndex];

          // Remove from myInterests
          state.myInterests.splice(interestIndex, 1);
          state.interestsPagination.total = Math.max(
            0,
            state.interestsPagination.total - 1
          );

          // Add back to opportunities list (reconstruct the opportunity)
          const opportunity = {
            _id: interest.opportunityId,
            title: interest.title,
            propertyType: interest.propertyType,
            location: interest.location,
            askingPrice: interest.askingPrice,
            projectedROI: interest.projectedROI,
            totalInvestment: interest.totalInvestment,
            status: interest.status,
            photos: interest.photos,
            hasExpressedInterest: false,
            description: "",
            interests: [],
            interestCount: 0,
            createdBy: { _id: "", firstName: "", lastName: "", email: "" },
            createdAt: "",
            updatedAt: "",
          };

          // Add to beginning of opportunities list
          state.opportunities.unshift(opportunity as any);
          state.pagination.total += 1;
        }

        // Update selectedOpportunity if it matches
        if (state.selectedOpportunity?._id === opportunityId) {
          state.selectedOpportunity.hasExpressedInterest = false;
        }
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearSelectedOpportunity,
  clearError,
  updateOpportunityStatus,
} = investmentOpportunitySlice.actions;

export default investmentOpportunitySlice.reducer;
