import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../services/apiService";
import type { User } from "../../types";

export const fetchAdminProfileThunk = createAsyncThunk(
  "adminProfile/fetchAdminProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/user/get-admins");
      const data = response.data;

      // Handle both single admin and multiple admins
      if (Array.isArray(data)) {
        return data as User[];
      } else if (data && typeof data === "object") {
        // If it's a single admin object, wrap it in an array
        return [data] as User[];
      } else {
        // If it's an array of admins in a wrapper object
        return data.admins || data.users || [];
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch admin profiles");
    }
  }
);
