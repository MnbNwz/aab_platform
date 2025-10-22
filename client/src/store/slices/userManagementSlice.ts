import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  User,
  UserStats,
  UsersResponse,
  UserFilters,
  UserManagementPaginationInfo,
} from "../../types";

export interface UserManagementState {
  // User statistics
  stats: UserStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Users list
  users: User[];
  pagination: UserManagementPaginationInfo | null;
  usersLoading: boolean;
  usersError: string | null;

  // Filters
  filters: UserFilters;

  // Selected user
  selectedUser: User | null;
  selectedUserLoading: boolean;
  selectedUserError: string | null;

  // Update operations
  updatingUsers: Record<string, boolean>; // userId -> isUpdating
  updateErrors: Record<string, string>; // userId -> error message
}

const initialState: UserManagementState = {
  stats: null,
  statsLoading: false,
  statsError: null,

  users: [],
  pagination: null,
  usersLoading: false,
  usersError: null,

  filters: {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  },

  selectedUser: null,
  selectedUserLoading: false,
  selectedUserError: null,

  updatingUsers: {},
  updateErrors: {},
};

export const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers: {
    // Stats actions
    setStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.statsLoading = action.payload;
      if (action.payload) {
        state.statsError = null;
      }
    },
    setStats: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
      state.statsLoading = false;
      state.statsError = null;
    },
    setStatsError: (state, action: PayloadAction<string>) => {
      state.statsError = action.payload;
      state.statsLoading = false;
    },

    // Users list actions
    setUsersLoading: (state, action: PayloadAction<boolean>) => {
      state.usersLoading = action.payload;
      if (action.payload) {
        state.usersError = null;
      }
    },
    setUsers: (state, action: PayloadAction<UsersResponse>) => {
      state.users = action.payload.users;
      state.pagination = action.payload.pagination;
      state.usersLoading = false;
      state.usersError = null;
    },
    setUsersError: (state, action: PayloadAction<string>) => {
      state.usersError = action.payload;
      state.usersLoading = false;
    },

    // Filters actions
    setFilters: (state, action: PayloadAction<Partial<UserFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      state.users = [];
    },

    // Selected user actions
    setSelectedUserLoading: (state, action: PayloadAction<boolean>) => {
      state.selectedUserLoading = action.payload;
      if (action.payload) {
        state.selectedUserError = null;
      }
    },
    setSelectedUser: (state, action: PayloadAction<User>) => {
      state.selectedUser = action.payload;
      state.selectedUserLoading = false;
      state.selectedUserError = null;
    },
    setSelectedUserError: (state, action: PayloadAction<string>) => {
      state.selectedUserError = action.payload;
      state.selectedUserLoading = false;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.selectedUserError = null;
    },

    // Update actions
    setUserUpdating: (
      state,
      action: PayloadAction<{ userId: string; isUpdating: boolean }>
    ) => {
      const { userId, isUpdating } = action.payload;
      if (isUpdating) {
        state.updatingUsers[userId] = true;
        delete state.updateErrors[userId];
      } else {
        delete state.updatingUsers[userId];
      }
    },
    updateUserInList: (state, action: PayloadAction<User>) => {
      const updatedUser = action.payload;
      const index = state.users.findIndex(
        (user) => user._id === updatedUser._id
      );
      if (index !== -1) {
        state.users[index] = updatedUser;
      }
      delete state.updatingUsers[updatedUser._id];
      delete state.updateErrors[updatedUser._id];

      // Update selected user if it's the same
      if (state.selectedUser && state.selectedUser._id === updatedUser._id) {
        state.selectedUser = updatedUser;
      }
    },
    setUpdateError: (
      state,
      action: PayloadAction<{ userId: string; error: string }>
    ) => {
      const { userId, error } = action.payload;
      state.updateErrors[userId] = error;
      delete state.updatingUsers[userId];
    },

    // Remove user from list (after revoke)
    removeUserFromList: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.users = state.users.filter((user) => user._id !== userId);
      delete state.updatingUsers[userId];
      delete state.updateErrors[userId];

      // Clear selected user if it's the same
      if (state.selectedUser && state.selectedUser._id === userId) {
        state.selectedUser = null;
      }
    },

    // Clear all errors
    clearErrors: (state) => {
      state.statsError = null;
      state.usersError = null;
      state.selectedUserError = null;
      state.updateErrors = {};
    },

    // Reset state
    resetUserManagement: () => initialState,
  },
});

export const {
  setStatsLoading,
  setStats,
  setStatsError,
  setUsersLoading,
  setUsers,
  setUsersError,
  setFilters,
  resetFilters,
  setSelectedUserLoading,
  setSelectedUser,
  setSelectedUserError,
  clearSelectedUser,
  setUserUpdating,
  updateUserInList,
  setUpdateError,
  removeUserFromList,
  clearErrors,
  resetUserManagement,
} = userManagementSlice.actions;

export default userManagementSlice.reducer;
