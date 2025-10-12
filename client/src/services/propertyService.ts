// Get all properties for the current user
export const getMyPropertiesApi = async () => {
  const res = await api.get("/api/property");
  return res.data;
};

// Update property active status (PATCH)
export const updatePropertyStatusApi = async (
  id: string,
  isActive: boolean
) => {
  const res = await api.patch(`/api/property/${id}/status`, { isActive });
  return res.data;
};
export const searchPropertiesApi = async (search: string) => {
  return api.get(`/api/property?search=${encodeURIComponent(search)}`);
};

import { api } from "./apiService";
import type { PropertyFormData } from "../store/slices/propertySlice";

export const createPropertyApi = async (data: PropertyFormData) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("propertyType", data.propertyType);
  formData.append("location", JSON.stringify(data.location));
  formData.append("area", String(data.area));
  formData.append("areaUnit", data.areaUnit);
  formData.append("totalRooms", String(data.totalRooms));
  formData.append("bedrooms", String(data.bedrooms));
  formData.append("bathrooms", String(data.bathrooms));
  formData.append("kitchens", String(data.kitchens));
  formData.append("description", data.description);
  if (typeof data.isActive === "boolean") {
    formData.append("isActive", String(data.isActive));
  }
  if (data.images && data.images.length > 0) {
    data.images.forEach((img: any) => {
      if (img instanceof File) {
        formData.append("images", img);
      }
    });
  }
  const res = await api.post("/api/property", formData);
  return res.data;
};
