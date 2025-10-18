// Service-related types

export interface ServicesState {
  services: string[];
  version: number | null;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if services have been fetched at least once
}

export interface ServicesResponse {
  services: string[];
  version: number;
  lastUpdated: string;
}
