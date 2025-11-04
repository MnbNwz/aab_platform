import { User } from "../types";
import type { ProfileFormDataParams } from "./types";

export type { ProfileFormDataParams };

export const buildProfileFormData = (
  params: ProfileFormDataParams
): FormData => {
  const formData = new FormData();

  // Basic user fields
  formData.append("firstName", params.firstName);
  formData.append("lastName", params.lastName);

  if (params.phone) {
    formData.append("phone", params.phone);
  }

  if (params.email) {
    formData.append("email", params.email);
  }

  // GeoHome object (required field)
  if (params.geoHome) {
    formData.append("geoHome", JSON.stringify(params.geoHome));
  }

  // Customer-specific fields
  if (params.customer) {
    formData.append("customer", JSON.stringify(params.customer));
  }

  // Contractor-specific fields
  if (params.contractor) {
    formData.append("contractor", JSON.stringify(params.contractor));
  }

  // Profile image file (if provided)
  if (params.profileImageFile) {
    formData.append("profileImage", params.profileImageFile);
  }

  return formData;
};

export const buildProfileFormDataFromUser = (
  user: User,
  updates: Partial<ProfileFormDataParams> = {}
): FormData => {
  const params: ProfileFormDataParams = {
    firstName: updates.firstName || user.firstName,
    lastName: updates.lastName || user.lastName,
    phone: updates.phone || user.phone,
    email: updates.email || user.email,
    geoHome:
      updates.geoHome ||
      (user.geoHome
        ? {
            type: "Point" as const,
            coordinates: user.geoHome.coordinates,
          }
        : undefined),
    customer:
      updates.customer ||
      (user.customer
        ? {
            defaultPropertyType: user.customer.defaultPropertyType as
              | "domestic"
              | "commercial",
          }
        : undefined),
    contractor: updates.contractor || user.contractor,
    profileImageFile: updates.profileImageFile,
  };

  return buildProfileFormData(params);
};

// Helper function specifically for profile image updates
export const buildProfileImageFormData = (
  user: User,
  imageFile: File
): FormData => {
  const formData = new FormData();

  // Always include all current user data to ensure backend has complete context
  formData.append("firstName", user.firstName);
  formData.append("lastName", user.lastName);

  if (user.phone) {
    formData.append("phone", user.phone);
  }

  if (user.email) {
    formData.append("email", user.email);
  }

  // Include geoHome if it exists
  if (user.geoHome) {
    formData.append(
      "geoHome",
      JSON.stringify({
        type: "Point",
        coordinates: user.geoHome.coordinates,
      })
    );
  }

  // Include customer data if user is customer
  if (user.customer) {
    formData.append(
      "customer",
      JSON.stringify({
        defaultPropertyType: user.customer.defaultPropertyType,
      })
    );
  }

  // Include contractor data if user is contractor
  if (user.contractor) {
    formData.append(
      "contractor",
      JSON.stringify({
        companyName: user.contractor.companyName,
        services: user.contractor.services,
        license: user.contractor.license,
        taxId: user.contractor.taxId,
        docs: user.contractor.docs,
      })
    );
  }

  // Add the new profile image file
  formData.append("profileImage", imageFile);

  return formData;
};
