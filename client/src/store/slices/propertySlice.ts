import { createSlice } from "@reduxjs/toolkit";
import type { PropertyFormData, PropertyState } from "../../types/property";

export type { PropertyFormData, PropertyState };

const initialState: PropertyState = {
  properties: [],
  property: null,
  loading: false,
  statusUpdateLoading: false,
  error: null,
};

import {
  createPropertyThunk,
  getMyPropertiesThunk,
  updatePropertyStatusThunk,
} from "../thunks/propertyThunks";

const propertySlice = createSlice({
  name: "property",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPropertyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPropertyThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.property = action.payload;
        // Add new property to the start of the list for immediate UI update
        if (action.payload && action.payload._id) {
          state.properties = [action.payload, ...state.properties];
        }
      })
      .addCase(createPropertyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create property";
      })

      // Fetch my properties
      .addCase(getMyPropertiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPropertiesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.properties = action.payload;
      })
      .addCase(getMyPropertiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch properties";
      })

      // Update property status (activate/deactivate)
      .addCase(updatePropertyStatusThunk.pending, (state) => {
        state.statusUpdateLoading = true;
        state.error = null;
      })
      .addCase(updatePropertyStatusThunk.fulfilled, (state, action) => {
        state.statusUpdateLoading = false;
        state.error = null;
        // Update the property in the list
        const idx = state.properties.findIndex(
          (p) => p._id === action.payload._id
        );
        if (idx !== -1) {
          state.properties[idx] = action.payload;
        }
      })
      .addCase(updatePropertyStatusThunk.rejected, (state, action) => {
        state.statusUpdateLoading = false;
        state.error =
          (action.payload as string) || "Failed to update property status";
      });
  },
});

export default propertySlice.reducer;
