import { createAsyncThunk } from "@reduxjs/toolkit";
import type { PropertyFormData } from "../slices/propertySlice";
import {
  createPropertyApi,
  getMyPropertiesApi,
  setPropertyInactiveApi,
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

export const setPropertyInactiveThunk = createAsyncThunk(
  "property/setInactive",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await setPropertyInactiveApi(id);
      return { id, ...response.property };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to set property inactive"
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
