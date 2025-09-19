import { createAsyncThunk } from "@reduxjs/toolkit";
import { api, handleApiError } from "../../services/apiService";
import type { UserFilters, UserUpdateData } from "../../types";
import {
  setStatsLoading,
  setStats,
  setStatsError,
  setUsersLoading,
  setUsers,
  setUsersError,
  setSelectedUserLoading,
  setSelectedUser,
  setSelectedUserError,
  setUserUpdating,
  updateUserInList,
  setUpdateError,
  removeUserFromList,
} from "../slices/userManagementSlice";

// Fetch user statistics
export const fetchUserStatsThunk = createAsyncThunk(
  "userManagement/fetchStats",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setStatsLoading(true));
      const stats = await api.userManagement.getStats();
      dispatch(setStats(stats));
      return stats;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setStatsError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch users with filters
export const fetchUsersThunk = createAsyncThunk(
  "userManagement/fetchUsers",
  async (filters: UserFilters, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUsersLoading(true));
      const usersResponse = await api.userManagement.getUsers(filters);
      dispatch(setUsers(usersResponse));
      return usersResponse;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setUsersError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Fetch single user
export const fetchUserThunk = createAsyncThunk(
  "userManagement/fetchUser",
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSelectedUserLoading(true));
      const user = await api.userManagement.getUser(userId);
      dispatch(setSelectedUser(user));
      return user;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setSelectedUserError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

// Update user
export const updateUserThunk = createAsyncThunk(
  "userManagement/updateUser",
  async (
    { userId, updateData }: { userId: string; updateData: UserUpdateData },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setUserUpdating({ userId, isUpdating: true }));
      const updatedUser = await api.userManagement.updateUser(
        userId,
        updateData
      );
      dispatch(updateUserInList(updatedUser));
      return updatedUser;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setUpdateError({ userId, error: errorMessage }));
      return rejectWithValue(errorMessage);
    }
  }
);

// Approve user (shortcut)
export const approveUserThunk = createAsyncThunk(
  "userManagement/approveUser",
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUserUpdating({ userId, isUpdating: true }));
      const updatedUser = await api.userManagement.approveUser(userId);
      dispatch(updateUserInList(updatedUser));
      return updatedUser;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setUpdateError({ userId, error: errorMessage }));
      return rejectWithValue(errorMessage);
    }
  }
);

// Reject user (shortcut)
export const rejectUserThunk = createAsyncThunk(
  "userManagement/rejectUser",
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUserUpdating({ userId, isUpdating: true }));
      const updatedUser = await api.userManagement.rejectUser(userId);
      dispatch(updateUserInList(updatedUser));
      return updatedUser;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setUpdateError({ userId, error: errorMessage }));
      return rejectWithValue(errorMessage);
    }
  }
);

// Revoke user (update status to revoke, don't remove from list)
export const revokeUserThunk = createAsyncThunk(
  "userManagement/revokeUser",
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setUserUpdating({ userId, isUpdating: true }));
      // Use updateUser instead of revokeUser to get the updated user back
      const updatedUser = await api.userManagement.updateUser(userId, {
        status: "revoke",
      });
      dispatch(updateUserInList(updatedUser));
      return updatedUser;
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(setUpdateError({ userId, error: errorMessage }));
      return rejectWithValue(errorMessage);
    }
  }
);
