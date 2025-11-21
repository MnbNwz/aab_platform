import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import { showToast } from "../../utils/toast";

import type { ServicesResponse } from "../../types/service";

// Services thunks
export const getServicesThunk = createAsyncThunk<
  ServicesResponse,
  void,
  { rejectValue: string }
>("services/getServices", async (_, { rejectWithValue }) => {
  try {
    const response = await api.services.getServices();
    return response;
  } catch (error) {
    const errorMessage = handleApiError(error);
    showToast.error("Failed to load services. Please try again.");
    return rejectWithValue(errorMessage);
  }
});
