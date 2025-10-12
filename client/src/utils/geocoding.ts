export interface GeocodeResult {
  address: string;
  houseNumber?: string;
  street?: string;
  neighbourhood?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
  full: string;
}

interface ForwardGeocodeResult {
  lat: number;
  lng: number;
  address: string;
  display_name: string;
}

interface NominatimResponse {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    street?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    district?: string;
    borough?: string;
    city_district?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    "ISO3166-2-lvl4"?: string;
  };
}

interface NominatimSearchResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    street?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    district?: string;
    borough?: string;
    city_district?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    "ISO3166-2-lvl4"?: string;
  };
}

// Cache for storing geocoding results
const geocodeCache = new Map<
  string,
  { result: GeocodeResult; timestamp: number }
>();
const forwardGeocodeCache = new Map<
  string,
  { result: ForwardGeocodeResult[]; timestamp: number }
>();

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Rate limiting: 1 request per second as per Nominatim usage policy
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

/**
 * Creates a cache key from coordinates
 * Rounds to ~100m precision to increase cache hits for nearby locations
 */
function createCacheKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 1000) / 1000; // ~111m precision
  const roundedLng = Math.round(lng * 1000) / 1000; // ~111m precision
  return `${roundedLat},${roundedLng}`;
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Enforces rate limiting for Nominatim API
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Formats the address from Nominatim response into detailed, human-readable format
 */
function formatAddress(data: NominatimResponse): GeocodeResult {
  const { display_name, address } = data;

  if (!address) {
    return {
      address: display_name,
      full: display_name,
    };
  }

  // Extract street address components
  const houseNumber = address.house_number || "";
  const street =
    address.road ||
    address.street ||
    address.pedestrian ||
    address.footway ||
    "";

  // Extract neighborhood/area components (in order of preference)
  const neighbourhood =
    address.neighbourhood ||
    address.suburb ||
    address.district ||
    address.borough ||
    address.city_district ||
    address.quarter ||
    "";

  // Extract city components (in order of preference)
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";

  // Extract state/province components
  const state =
    address.state ||
    address.province ||
    address.region ||
    address.state_district ||
    address["ISO3166-2-lvl4"] ||
    "";

  // Extract country
  const country = address.country || "";

  // Extract postal code
  const postcode = address.postcode || "";

  // Build detailed address components
  const addressParts: string[] = [];

  // Street address (house number + street)
  if (houseNumber && street) {
    addressParts.push(`${houseNumber} ${street}`);
  } else if (street) {
    addressParts.push(street);
  } else if (houseNumber) {
    addressParts.push(houseNumber);
  }

  // Neighborhood/District
  if (neighbourhood) {
    addressParts.push(neighbourhood);
  }

  // City
  if (city) {
    addressParts.push(city);
  }

  // State/Province
  if (state) {
    addressParts.push(state);
  }

  // Country
  if (country) {
    addressParts.push(country);
  }

  // Postal code (add at the end if available)
  let formattedAddress = addressParts.filter(Boolean).join(", ");
  if (postcode && formattedAddress) {
    formattedAddress += ` ${postcode}`;
  } else if (postcode) {
    formattedAddress = postcode;
  }

  // Fallback to display_name if we couldn't build a good address
  if (!formattedAddress || formattedAddress.length < 3) {
    formattedAddress = display_name;
  }

  return {
    address: formattedAddress,
    houseNumber,
    street,
    neighbourhood,
    district: address.district || "",
    city,
    state,
    country,
    postcode,
    full: display_name,
  };
}

/**
 * Reverse geocode coordinates to get readable address
 * Uses Nominatim API with caching and rate limiting
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  // Validate coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    throw new Error("Invalid coordinates provided");
  }

  // Check cache first
  const cacheKey = createCacheKey(lat, lng);
  const cached = geocodeCache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp)) {
    return cached.result;
  }

  try {
    // Enforce rate limiting
    await enforceRateLimit();

    // Make API request
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AAS-Platform-Client/1.0 (Property Management System)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: NominatimResponse = await response.json();

    if (!data.display_name) {
      throw new Error("No address found for coordinates");
    }

    // Format the result
    const result = formatAddress(data);

    // Cache the result
    geocodeCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    // Return fallback coordinates format
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      full: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
}

/**
 * Get address from coordinates with fallback to coordinates display
 * This is the main function components should use
 */
export async function getAddressFromCoordinates(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): Promise<string> {
  if (!coordinates) {
    return "Location not available";
  }

  let lat: number, lng: number;

  // Handle different coordinate formats
  if (Array.isArray(coordinates)) {
    [lng, lat] = coordinates; // GeoJSON format: [longitude, latitude]
  } else {
    lat = coordinates.lat;
    lng = coordinates.lng;
  }

  try {
    const result = await reverseGeocode(lat, lng);
    return result.address;
  } catch (error) {
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Get detailed address components from coordinates
 * Returns full GeocodeResult with all available address parts
 */
export async function getDetailedAddressFromCoordinates(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): Promise<GeocodeResult | null> {
  if (!coordinates) {
    return null;
  }

  let lat: number, lng: number;

  // Handle different coordinate formats
  if (Array.isArray(coordinates)) {
    [lng, lat] = coordinates; // GeoJSON format: [longitude, latitude]
  } else {
    lat = coordinates.lat;
    lng = coordinates.lng;
  }

  try {
    const result = await reverseGeocode(lat, lng);
    return result;
  } catch (error) {
    // Return basic fallback
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      full: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
}

/**
 * Get short address (street + city) from coordinates
 * Useful for compact displays
 */
export async function getShortAddressFromCoordinates(
  coordinates:
    | [number, number]
    | { lat: number; lng: number }
    | null
    | undefined
): Promise<string> {
  if (!coordinates) {
    return "Location not available";
  }

  try {
    const result = await getDetailedAddressFromCoordinates(coordinates);
    if (!result) return "Location not available";

    const parts: string[] = [];

    // Add street address
    if (result.houseNumber && result.street) {
      parts.push(`${result.houseNumber} ${result.street}`);
    } else if (result.street) {
      parts.push(result.street);
    }

    // Add city
    if (result.city) {
      parts.push(result.city);
    }

    return parts.length > 0 ? parts.join(", ") : result.address;
  } catch (error) {
    let lat: number, lng: number;
    if (Array.isArray(coordinates)) {
      [lng, lat] = coordinates;
    } else {
      lat = coordinates.lat;
      lng = coordinates.lng;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Batch reverse geocode multiple coordinates
 * Useful for property lists to minimize API calls
 */
export async function batchReverseGeocode(
  coordinatesArray: Array<{ id: string; coordinates: [number, number] }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const item of coordinatesArray) {
    try {
      const address = await getAddressFromCoordinates(item.coordinates);
      results.set(item.id, address);
    } catch (error) {
      const [lng, lat] = item.coordinates;
      results.set(item.id, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }

  return results;
}

/**
 * Forward geocode address to get coordinates
 * Uses Nominatim API with caching and rate limiting
 */
export async function forwardGeocode(
  query: string,
  limit: number = 5
): Promise<ForwardGeocodeResult[]> {
  if (!query || !query.trim()) {
    throw new Error("Search query is required");
  }

  const trimmedQuery = query.trim();

  // Check cache first
  const cached = forwardGeocodeCache.get(trimmedQuery);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.result;
  }

  try {
    // Enforce rate limiting
    await enforceRateLimit();

    // Make API request
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmedQuery
      )}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AAS-Platform-Client/1.0 (Property Management System)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: NominatimSearchResponse[] = await response.json();

    // Format results
    const results: ForwardGeocodeResult[] = data.map((item) => ({
      lat: Number(parseFloat(item.lat).toFixed(6)),
      lng: Number(parseFloat(item.lon).toFixed(6)),
      address: formatAddress({
        display_name: item.display_name,
        address: item.address,
      }).address,
      display_name: item.display_name,
    }));

    // Cache the results
    forwardGeocodeCache.set(trimmedQuery, {
      result: results,
      timestamp: Date.now(),
    });

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Search for locations and return formatted results
 * This replaces the scattered search functionality in LocationSelector
 */
export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<
  Array<{
    lat: number;
    lng: number;
    address: string;
  }>
> {
  try {
    const results = await forwardGeocode(query, limit);
    return results.map((result) => ({
      lat: result.lat,
      lng: result.lng,
      address: result.address || result.display_name,
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Get coordinates from click events with reverse geocoding
 * This replaces the MapClickHandler functionality
 */
export async function getLocationFromClick(
  lat: number,
  lng: number
): Promise<{
  lat: number;
  lng: number;
  address: string;
}> {
  try {
    const result = await reverseGeocode(lat, lng);
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: result.address,
    };
  } catch (error) {
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  }
}

/**
 * Clear all geocoding caches
 * Useful for testing or if you want to force fresh data
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  forwardGeocodeCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  reverse: { size: number; entries: Array<{ key: string; age: number }> };
  forward: { size: number; entries: Array<{ key: string; age: number }> };
} {
  const reverseEntries = Array.from(geocodeCache.entries()).map(
    ([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
    })
  );

  const forwardEntries = Array.from(forwardGeocodeCache.entries()).map(
    ([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
    })
  );

  return {
    reverse: {
      size: geocodeCache.size,
      entries: reverseEntries,
    },
    forward: {
      size: forwardGeocodeCache.size,
      entries: forwardEntries,
    },
  };
}

/**
 * Get current user location using IP-based geolocation
 * Returns coordinates with fallback to default location
 */
export async function getCurrentLocation(): Promise<{
  lat: number;
  lng: number;
  address?: string;
}> {
  // Try multiple IP geolocation services with fallbacks
  const services = [
    {
      name: "ipapi.co",
      url: "https://ipapi.co/json/",
      parser: (data: any) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
      }),
    },
    {
      name: "ipwhois",
      url: "https://ipwho.is/",
      parser: (data: any) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country,
      }),
    },
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        continue; // Try next service
      }

      const data = await response.json();
      const parsed = service.parser(data);

      if (parsed.lat && parsed.lng) {
        const lat = Number(parsed.lat.toFixed(6));
        const lng = Number(parsed.lng.toFixed(6));

        // Try to get a readable address
        try {
          const addressResult = await reverseGeocode(lat, lng);
          return {
            lat,
            lng,
            address: addressResult.address,
          };
        } catch (error) {
          // If reverse geocoding fails, use city/region info from IP
          const addressParts = [
            parsed.city,
            parsed.region,
            parsed.country,
          ].filter(Boolean);
          const address =
            addressParts.length > 0
              ? addressParts.join(", ")
              : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          return {
            lat,
            lng,
            address,
          };
        }
      }
    } catch (error) {
      // Continue to next service
    }
  }

  // All services failed - use default fallback location
  return {
    lat: 40.73061,
    lng: -73.935242,
    address: "New York, NY",
  };
}
