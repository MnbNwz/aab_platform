// Geocoding-related types

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

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
  address: string;
  display_name: string;
}

export interface NominatimResponse {
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

export interface NominatimSearchResponse {
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

export interface LocationResult {
  lat: number;
  lng: number;
  address: string;
}
