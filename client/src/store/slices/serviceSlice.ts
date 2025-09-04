import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ServiceRequest {
  id: string;
  customerId: string;
  serviceType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: string;
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  preferredDate?: string;
  budget?: {
    min: number;
    max: number;
  };
  contractorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ServiceState {
  requests: ServiceRequest[];
  currentRequest: ServiceRequest | null;
  isLoading: boolean;
  error: string | null;
  submitLoading: boolean;
  filters: {
    status: string;
    serviceType: string;
    priority: string;
  };
}

const initialState: ServiceState = {
  requests: [],
  currentRequest: null,
  isLoading: false,
  error: null,
  submitLoading: false,
  filters: {
    status: '',
    serviceType: '',
    priority: '',
  },
};

export const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    fetchRequestsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    fetchRequestsSuccess: (state, action: PayloadAction<ServiceRequest[]>) => {
      state.isLoading = false;
      state.requests = action.payload;
      state.error = null;
    },
    
    fetchRequestsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    submitRequestStart: (state) => {
      state.submitLoading = true;
      state.error = null;
    },
    
    submitRequestSuccess: (state, action: PayloadAction<ServiceRequest>) => {
      state.submitLoading = false;
      state.requests.unshift(action.payload);
      state.error = null;
    },
    
    submitRequestFailure: (state, action: PayloadAction<string>) => {
      state.submitLoading = false;
      state.error = action.payload;
    },
    
    updateRequestStatus: (state, action: PayloadAction<{
      requestId: string;
      status: string;
    }>) => {
      const request = state.requests.find(r => r.id === action.payload.requestId);
      if (request) {
        request.status = action.payload.status;
        request.updatedAt = new Date().toISOString();
      }
    },
    
    setCurrentRequest: (state, action: PayloadAction<ServiceRequest | null>) => {
      state.currentRequest = action.payload;
    },
    
    updateFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearServiceError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchRequestsStart,
  fetchRequestsSuccess,
  fetchRequestsFailure,
  submitRequestStart,
  submitRequestSuccess,
  submitRequestFailure,
  updateRequestStatus,
  setCurrentRequest,
  updateFilters,
  clearServiceError,
} = serviceSlice.actions;
