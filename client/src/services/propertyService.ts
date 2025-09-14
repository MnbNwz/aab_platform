// Get all properties for the current user
export const getMyPropertiesApi = async () => {
  const res = await api.get("/api/property");
  return res.data;
};

// Set a property as inactive (PUT)
export const setPropertyInactiveApi = async (id: string) => {
  const formData = new FormData();
  formData.append("isActive", "false");
  const res = await api.put(`/api/property/${id}`, formData);
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
