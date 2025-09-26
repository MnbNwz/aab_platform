import { useState, useEffect, useCallback } from "react";
import {
  getAddressFromCoordinates,
  getDetailedAddressFromCoordinates,
  getShortAddressFromCoordinates,
  searchLocations,
  getLocationFromClick,
  getCurrentLocation,
  GeocodeResult,
} from "../utils/geocoding";

interface UseGeocodingResult {
  address: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook for reverse geocoding coordinates to readable addresses
 * Automatically handles loading states and errors
 */
export function useGeocoding(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): UseGeocodingResult {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) {
      setAddress(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAddressFromCoordinates(coordinates);

        if (!isCancelled) {
          setAddress(result);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to get address"
          );

          // Fallback to coordinates display
          let lat: number, lng: number;
          if (Array.isArray(coordinates)) {
            [lng, lat] = coordinates;
          } else {
            lat = coordinates.lat;
            lng = coordinates.lng;
          }
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAddress();

    // Cleanup function to cancel the request if component unmounts
    return () => {
      isCancelled = true;
    };
  }, [coordinates]);

  return { address, loading, error };
}

/**
 * Hook for detailed address information with all components
 */
export function useDetailedGeocoding(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): {
  addressData: GeocodeResult | null;
  address: string | null;
  loading: boolean;
  error: string | null;
} {
  const [addressData, setAddressData] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) {
      setAddressData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchDetailedAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getDetailedAddressFromCoordinates(coordinates);

        if (!isCancelled) {
          setAddressData(result);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to get address"
          );

          // Fallback to coordinates display
          let lat: number, lng: number;
          if (Array.isArray(coordinates)) {
            [lng, lat] = coordinates;
          } else {
            lat = coordinates.lat;
            lng = coordinates.lng;
          }
          setAddressData({
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            full: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetailedAddress();

    return () => {
      isCancelled = true;
    };
  }, [coordinates]);

  return {
    addressData,
    address: addressData?.address || null,
    loading,
    error,
  };
}

/**
 * Hook for short address format (street + city)
 * Useful for compact displays
 */
export function useShortGeocoding(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): {
  shortAddress: string | null;
  loading: boolean;
  error: string | null;
} {
  const [shortAddress, setShortAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinates) {
      setShortAddress(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchShortAddress = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getShortAddressFromCoordinates(coordinates);

        if (!isCancelled) {
          setShortAddress(result);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to get address"
          );

          // Fallback to coordinates display
          let lat: number, lng: number;
          if (Array.isArray(coordinates)) {
            [lng, lat] = coordinates;
          } else {
            lat = coordinates.lat;
            lng = coordinates.lng;
          }
          setShortAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchShortAddress();

    return () => {
      isCancelled = true;
    };
  }, [coordinates]);

  return { shortAddress, loading, error };
}

/**
 * Hook for multiple coordinates (useful for lists)
 */
export function useMultipleGeocoding(
  coordinatesArray: Array<{ id: string; coordinates: [number, number] }> | null
): {
  addresses: Map<string, string>;
  loading: boolean;
  error: string | null;
} {
  const [addresses, setAddresses] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coordinatesArray || coordinatesArray.length === 0) {
      setAddresses(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchAddresses = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = new Map<string, string>();

        // Process each coordinate sequentially to respect rate limits
        for (const item of coordinatesArray) {
          if (isCancelled) break;

          try {
            const address = await getAddressFromCoordinates(item.coordinates);
            results.set(item.id, address);
          } catch (err) {
            // Fallback to coordinates for this specific item
            const [lng, lat] = item.coordinates;
            results.set(item.id, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        }

        if (!isCancelled) {
          setAddresses(results);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to get addresses"
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAddresses();

    return () => {
      isCancelled = true;
    };
  }, [coordinatesArray]);

  return { addresses, loading, error };
}

/**
 * Hook for location search (forward geocoding)
 */
export function useLocationSearch() {
  const [results, setResults] = useState<
    Array<{
      lat: number;
      lng: number;
      address: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, limit: number = 5) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchLocations(query, limit);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}

/**
 * Hook for map click handling with reverse geocoding
 */
export function useMapClickGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMapClick = async (
    lat: number,
    lng: number
  ): Promise<{
    lat: number;
    lng: number;
    address: string;
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLocationFromClick(lat, lng);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleMapClick,
  };
}

/**
 * Hook for getting current user location using IP geolocation
 * Automatically fetches location on mount and provides manual refresh
 */
export function useCurrentLocation() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get current location";
      setError(errorMessage);
      console.error("Current location error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const refresh = useCallback(
    () => fetchCurrentLocation(),
    [fetchCurrentLocation]
  );

  return {
    location,
    loading,
    error,
    fetchCurrentLocation,
    refresh,
  };
}
