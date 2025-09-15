import { createSlice } from "@reduxjs/toolkit";

export interface PropertyFormData {
  title: string;
  propertyType: "apartment" | "house" | "villa";
  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
  };
  area: number;
  areaUnit: "sqft" | "sqm" | "marla" | "kanal";
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: (string | File)[];
  isActive?: boolean;
  _id?: string;
}

export interface PropertyState {
  properties: PropertyFormData[];
  property: PropertyFormData | null;
  loading: boolean;
  error: string | null;
}

const initialState: PropertyState = {
  properties: [],
  property: null,
  loading: false,
  error: null,
};

import {
  createPropertyThunk,
  getMyPropertiesThunk,
  setPropertyInactiveThunk,
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

      // Set property inactive
      .addCase(setPropertyInactiveThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setPropertyInactiveThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the property in the list
        const idx = state.properties.findIndex(
          (p) => p._id === action.payload.id
        );
        if (idx !== -1) {
          state.properties[idx].isActive = false;
        }
      })
      .addCase(setPropertyInactiveThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to set property inactive";
      });
  },
});

export default propertySlice.reducer;
