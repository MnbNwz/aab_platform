// Service-related types

export interface ExtendedService {
  name: string;
  materialUnit: number;
  laborUnit: number;
  comment: string;
}

export interface ServicesState {
  services: string[];
  version: number | null;
  lastUpdated: string | null;
  extended: ExtendedService[] | null; // Extended service details with pricing/rates
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if services have been fetched at least once
}

export interface ServicesResponse {
  services: string[];
  version: number;
  lastUpdated: string;
  extended?: ExtendedService[]; // Optional - Extended service details with pricing/rates
}

export interface CreateServiceRequest {
  name: string;
  materialUnit: number;
  laborUnit: number;
  comment: string;
}

export interface CreateServiceResponse {
  success: boolean;
  message: string;
  data: {
    legacy: {
      services: string[];
      version: number;
      servicesCount: number;
    };
    extended: ExtendedService & { id: string };
  };
}
