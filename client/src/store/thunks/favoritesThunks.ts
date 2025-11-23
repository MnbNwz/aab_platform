import type { AppDispatch } from "../index";
import favoritesService from "../../services/favoritesService";
import {
  fetchFavoritesStart,
  fetchFavoritesSuccess,
  fetchFavoritesFailure,
  addFavoriteStart,
  addFavoriteSuccess,
  addFavoriteFailure,
  removeFavoriteStart,
  removeFavoriteSuccess,
  removeFavoriteFailure,
} from "../slices/favoritesSlice";
import { showToast } from "../../utils/toast";

/**
 * Fetch all favorite contractors with their profiles
 */
export const fetchFavoritesThunk = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(fetchFavoritesStart());
    const data = await favoritesService.getFavorites();

    if (data && data.success) {
      dispatch(
        fetchFavoritesSuccess({
          favoriteContractors: data.favoriteContractors || [],
          totalFavorites: data.totalFavorites || 0,
          maxFavorites: data.maxFavorites || 10,
          canAddMore: data.canAddMore || false,
        })
      );
    } else {
      // Handle API error response
      const errorMessage = (data && data.error) || "Failed to fetch favorites";
      dispatch(fetchFavoritesFailure(errorMessage));
      showToast.error(errorMessage);
    }
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch favorites";
    dispatch(fetchFavoritesFailure(errorMessage));
    showToast.error(errorMessage);
  }
};

/**
 * Add a contractor to favorites
 * @param contractorId - The ID of the contractor to add
 */
export const addFavoriteThunk =
  (contractorId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(addFavoriteStart(contractorId));
      const data = await favoritesService.addFavorite(contractorId);

      if (data.success) {
        dispatch(addFavoriteSuccess(contractorId));
        showToast.success(data.message || "Added to favorites");

        // Refresh the favorites list to get updated contractor profiles and confirm the addition
        dispatch(fetchFavoritesThunk());
      } else {
        // Handle API error response
        const errorMessage = data.error || "Failed to add to favorites";
        dispatch(addFavoriteFailure({ contractorId, error: errorMessage }));

        if (data.maxReached) {
          showToast.error("Maximum 10 favorites reached!");
        } else {
          showToast.error(errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to add to favorites";
      dispatch(addFavoriteFailure({ contractorId, error: errorMessage }));
      showToast.error(errorMessage);
    }
  };

/**
 * Remove a contractor from favorites
 * @param contractorId - The ID of the contractor to remove
 */
export const removeFavoriteThunk =
  (contractorId: string) => async (dispatch: AppDispatch) => {
    try {
      dispatch(removeFavoriteStart(contractorId));
      const data = await favoritesService.removeFavorite(contractorId);

      if (data.success) {
        dispatch(
          removeFavoriteSuccess({
            contractorId,
            favoriteContractors: data.favoriteContractors || [],
            totalFavorites: data.totalFavorites || 0,
          })
        );
        showToast.success(data.message || "Removed from favorites");
      } else {
        // Handle API error response
        const errorMessage = data.error || "Failed to remove from favorites";
        dispatch(removeFavoriteFailure({ contractorId, error: errorMessage }));
        showToast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to remove from favorites";
      dispatch(removeFavoriteFailure({ contractorId, error: errorMessage }));
      showToast.error(errorMessage);
    }
  };
