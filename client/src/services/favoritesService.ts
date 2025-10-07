import { api } from "./apiService";

export interface FavoriteContractor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string | null;
  approval: string;
  geoHome?: {
    type: string;
    coordinates: [number, number];
  };
  contractor?: {
    companyName?: string;
    services?: string[];
    license?: string;
    taxId?: string;
    docs?: Array<{
      name: string;
      url: string;
    }>;
  };
}

export interface FavoritesResponse {
  success: boolean;
  favoriteContractors?: FavoriteContractor[];
  totalFavorites?: number;
  maxFavorites?: number;
  canAddMore?: boolean;
  error?: string;
}

export interface AddFavoriteResponse {
  success: boolean;
  message?: string;
  favoriteContractors?: string[];
  totalFavorites?: number;
  error?: string;
  maxReached?: boolean;
}

export interface RemoveFavoriteResponse {
  success: boolean;
  message?: string;
  favoriteContractors?: string[];
  totalFavorites?: number;
  error?: string;
}

class FavoritesService {
  /**
   * Get all favorite contractors with their profiles
   */
  async getFavorites(): Promise<FavoritesResponse> {
    const response = await api.get<FavoritesResponse>("/api/favorites");
    // The apiService wraps the response, so we need to return response.data
    // which contains the actual server response
    return response.data as FavoritesResponse;
  }

  /**
   * Add a contractor to favorites
   * @param contractorId - The ID of the contractor to add
   */
  async addFavorite(contractorId: string): Promise<AddFavoriteResponse> {
    const response = await api.post<AddFavoriteResponse>(
      `/api/favorites/${contractorId}`
    );
    return response.data;
  }

  /**
   * Remove a contractor from favorites
   * @param contractorId - The ID of the contractor to remove
   */
  async removeFavorite(contractorId: string): Promise<RemoveFavoriteResponse> {
    const response = await api.delete<RemoveFavoriteResponse>(
      `/api/favorites/${contractorId}`
    );
    return response.data;
  }

  /**
   * Check if a contractor is favorited
   * @param contractorId - The ID of the contractor to check
   * @param favorites - Array of favorite contractor IDs
   */
  isFavorited(contractorId: string, favorites: string[]): boolean {
    return favorites.includes(contractorId);
  }
}

export default new FavoritesService();
