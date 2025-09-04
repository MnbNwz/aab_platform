import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, handleApiError } from '../../services/apiService';
import { showToast } from '../../utils/toast';

// Services thunks
export const getServicesThunk = createAsyncThunk<
  { services: string[]; version: number; lastUpdated: string },
  void,
  { rejectValue: string }
>(
  'services/getServices',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚀 Fetching services from API...');
      const response = await api.services.getServices();
      console.log('✅ Services fetched successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch services:', error);
      const errorMessage = handleApiError(error);
      showToast.error('Failed to load services. Please try again.');
      return rejectWithValue(errorMessage);
    }
  }
);
