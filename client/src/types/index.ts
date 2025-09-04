// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'customer' | 'contractor';

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  geoHome: {
    type: string;
    coordinates: [number, number];
  };
  // Role-specific nested data
  customer?: {
    defaultPropertyType: string;
  };
  contractor?: {
    companyName: string;
    services: string[];
    license: string;
    taxId: string;
    docs: any[];
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  message: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}
