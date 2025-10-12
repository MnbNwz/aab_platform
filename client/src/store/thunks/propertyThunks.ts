import { createAsyncThunk } from "@reduxjs/toolkit";
import type { PropertyFormData } from "../slices/propertySlice";
import {
  createPropertyApi,
  getMyPropertiesApi,
  updatePropertyStatusApi,
} from "../../services/propertyService";

export const getMyPropertiesThunk = createAsyncThunk(
  "property",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyPropertiesApi();
      return response.properties || response;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch properties"
      );
    }
  }
);

export const updatePropertyStatusThunk = createAsyncThunk(
  "property/updateStatus",
  async (
    { id, isActive }: { id: string; isActive: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await updatePropertyStatusApi(id, isActive);
      return response.property;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update property status"
      );
    }
  }
);

export const createPropertyThunk = createAsyncThunk(
  "property/create",
  async (data: PropertyFormData, { rejectWithValue }) => {
    try {
      const response = await createPropertyApi(data);
      return response.property;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create property"
      );
    }
  }
);
