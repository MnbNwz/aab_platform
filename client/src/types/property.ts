// Property-related types

export interface PropertyFormData {
  title: string;
  propertyType: "apartment" | "house" | "villa";
  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
  };
  area: number;
  areaUnit: "sqft" | "sqm" | "marla" | "kanal";
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description: string;
  images: (string | File)[];
  isActive?: boolean;
  _id?: string;
}

export interface PropertyInJob {
  _id: string;
  userId: string;
  title: string;
  propertyType: "apartment" | "house" | "villa";
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  area: number;
  areaUnit: "sqft" | "sqm";
  totalRooms: number;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  description?: string;
  images?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyState {
  properties: PropertyFormData[];
  property: PropertyFormData | null;
  loading: boolean;
  statusUpdateLoading: boolean;
  error: string | null;
}
