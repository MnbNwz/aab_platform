import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  paymentService,
  PaymentFilters,
  Payment,
} from "../../services/paymentService";

export const fetchPaymentHistory = createAsyncThunk(
  "payment/fetchPaymentHistory",
  async (filters: PaymentFilters = {}, { rejectWithValue }) => {
    try {
      const res = await paymentService.getHistory(filters);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch payment history");
    }
  }
);

export const fetchPaymentDetail = createAsyncThunk(
  "payment/fetchPaymentDetail",
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const res = await paymentService.getPaymentDetail(paymentId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch payment details");
    }
  }
);

interface PaymentState {
  history: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    } | null;
    loading: boolean;
    error: string | null;
  };
  detail: {
    payment: Payment | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: PaymentState = {
  history: {
    payments: [],
    pagination: null,
    loading: false,
    error: null,
  },
  detail: {
    payment: null,
    loading: false,
    error: null,
  },
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentError(state) {
      state.history.error = null;
      state.detail.error = null;
    },
    clearPaymentDetail(state) {
      state.detail.payment = null;
      state.detail.error = null;
    },
    resetPayment(state) {
      state.history.payments = [];
      state.history.pagination = null;
      state.history.loading = false;
      state.history.error = null;
      state.detail.payment = null;
      state.detail.loading = false;
      state.detail.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.history.loading = true;
        state.history.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.history.loading = false;

        if (
          action.payload &&
          action.payload.success &&
          Array.isArray(action.payload.data)
        ) {
          state.history.payments = action.payload.data;
        } else {
          state.history.payments = [];
        }

        if (action.payload && action.payload.pagination) {
          state.history.pagination = {
            page: action.payload.pagination.currentPage || 1,
            limit: action.payload.pagination.itemsPerPage || 10,
            total: action.payload.pagination.totalItems || 0,
            pages: action.payload.pagination.totalPages || 1,
          };
        } else {
          state.history.pagination = {
            page: 1,
            limit: 10,
            total: 0,
            pages: 1,
          };
        }
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.history.loading = false;
        state.history.error = action.payload as string;
      })
      .addCase(fetchPaymentDetail.pending, (state) => {
        state.detail.loading = true;
        state.detail.error = null;
      })
      .addCase(fetchPaymentDetail.fulfilled, (state, action) => {
        state.detail.loading = false;
        state.detail.payment = action.payload;
      })
      .addCase(fetchPaymentDetail.rejected, (state, action) => {
        state.detail.loading = false;
        state.detail.error = action.payload as string;
      });
  },
});

export const { clearPaymentError, clearPaymentDetail, resetPayment } =
  paymentSlice.actions;
export default paymentSlice.reducer;
