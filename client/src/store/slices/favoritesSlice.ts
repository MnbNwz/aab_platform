import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { FavoriteContractor } from "../../services/favoritesService";

export interface FavoritesState {
  favorites: FavoriteContractor[];
  favoriteIds: string[];
  totalFavorites: number;
  maxFavorites: number;
  canAddMore: boolean;
  loading: boolean;
  error: string | null;
  adding: { [contractorId: string]: boolean };
  removing: { [contractorId: string]: boolean };
}

const initialState: FavoritesState = {
  favorites: [],
  favoriteIds: [],
  totalFavorites: 0,
  maxFavorites: 10,
  canAddMore: true,
  loading: false,
  error: null,
  adding: {},
  removing: {},
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    // Fetch favorites
    fetchFavoritesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchFavoritesSuccess(
      state,
      action: PayloadAction<{
        favoriteContractors: FavoriteContractor[];
        totalFavorites: number;
        maxFavorites: number;
        canAddMore: boolean;
      }>
    ) {
      state.loading = false;
      state.favorites = action.payload.favoriteContractors;
      state.favoriteIds = action.payload.favoriteContractors.map((c) => c._id);
      state.totalFavorites = action.payload.totalFavorites;
      state.maxFavorites = action.payload.maxFavorites;
      state.canAddMore = action.payload.canAddMore;
      state.error = null;
    },
    fetchFavoritesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Add favorite
    addFavoriteStart(state, action: PayloadAction<string>) {
      state.adding[action.payload] = true;
      state.error = null;
    },
    addFavoriteSuccess(state, action: PayloadAction<string>) {
      state.adding[action.payload] = false;
      state.error = null;
    },
    addFavoriteFailure(
      state,
      action: PayloadAction<{ contractorId: string; error: string }>
    ) {
      state.adding[action.payload.contractorId] = false;
      state.error = action.payload.error;
    },

    // Remove favorite
    removeFavoriteStart(state, action: PayloadAction<string>) {
      state.removing[action.payload] = true;
      state.error = null;
    },
    removeFavoriteSuccess(
      state,
      action: PayloadAction<{
        contractorId: string;
        favoriteContractors: string[];
        totalFavorites: number;
      }>
    ) {
      state.removing[action.payload.contractorId] = false;
      state.favorites = state.favorites.filter(
        (c) => c._id !== action.payload.contractorId
      );
      state.favoriteIds = action.payload.favoriteContractors;
      state.totalFavorites = action.payload.totalFavorites;
      state.canAddMore = action.payload.totalFavorites < state.maxFavorites;
      state.error = null;
    },
    removeFavoriteFailure(
      state,
      action: PayloadAction<{ contractorId: string; error: string }>
    ) {
      state.removing[action.payload.contractorId] = false;
      state.error = action.payload.error;
    },

    // Clear error
    clearFavoritesError(state) {
      state.error = null;
    },

    // Reset state (for logout)
    resetFavoritesState() {
      return initialState;
    },
  },
});

export const {
  fetchFavoritesStart,
  fetchFavoritesSuccess,
  fetchFavoritesFailure,
  addFavoriteStart,
  addFavoriteSuccess,
  addFavoriteFailure,
  removeFavoriteStart,
  removeFavoriteSuccess,
  removeFavoriteFailure,
  clearFavoritesError,
  resetFavoritesState,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
