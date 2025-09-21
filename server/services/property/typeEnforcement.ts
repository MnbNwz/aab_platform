import { JobRequest } from "@models/job";
import { Property } from "@models/property";
import { User } from "@models/user";
import { logErrorWithContext } from "@utils/core";

// Check if customer can use a specific property for job request
export const canUsePropertyForJobRequest = async (
  customerId: string,
  propertyId: string,
): Promise<{ canUse: boolean; reason?: string; existingPropertyId?: string }> => {
  try {
    // Get customer details
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== "customer") {
      return { canUse: false, reason: "Customer not found or invalid role" };
    }

    // Get customer's default property type
    const defaultPropertyType = customer.customer?.defaultPropertyType || "domestic";

    // Get the property they want to use
    const property = await Property.findById(propertyId);
    if (!property) {
      return { canUse: false, reason: "Property not found" };
    }

    // Check if property belongs to customer
    if (property.userId.toString() !== customerId) {
      return { canUse: false, reason: "Property does not belong to customer" };
    }

    // For domestic customers - enforce single property rule
    if (defaultPropertyType === "domestic") {
      // Check if customer has any existing job requests
      const existingJobRequests = await JobRequest.find({
        createdBy: customerId,
        status: { $in: ["open", "inprogress", "hold"] }, // Active job requests
      }).populate("property");

      if (existingJobRequests.length > 0) {
        // Get the property used in the first job request
        const firstJobProperty = existingJobRequests[0].property as any;
        const existingPropertyId = firstJobProperty._id.toString();

        // Check if they're trying to use the same property
        if (propertyId === existingPropertyId) {
          return { canUse: true, reason: "Same property as existing job request" };
        } else {
          return {
            canUse: false,
            reason:
              "Domestic customers can only use one property for all job requests. You must use the same property as your existing job request.",
            existingPropertyId,
          };
        }
      } else {
        // No existing job requests, can use any property
        return { canUse: true, reason: "First job request, property allowed" };
      }
    }

    // For commercial customers - can use any property
    if (defaultPropertyType === "commercial") {
      return { canUse: true, reason: "Commercial customers can use any property" };
    }

    return { canUse: false, reason: "Invalid property type" };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "canUsePropertyForJobRequest",
      customerId,
      propertyId,
    });
    return { canUse: false, reason: "Internal server error" };
  }
};

// Get customer's allowed properties for job requests
export const getAllowedPropertiesForJobRequest = async (
  customerId: string,
): Promise<{ properties: any[]; message: string }> => {
  try {
    // Get customer details
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== "customer") {
      return { properties: [], message: "Customer not found or invalid role" };
    }

    // Get customer's default property type
    const defaultPropertyType = customer.customer?.defaultPropertyType || "domestic";

    // Get all customer's properties
    const allProperties = await Property.find({ userId: customerId, isActive: true });

    // For domestic customers - check existing job requests
    if (defaultPropertyType === "domestic") {
      const existingJobRequests = await JobRequest.find({
        createdBy: customerId,
        status: { $in: ["open", "inprogress", "hold"] },
      }).populate("property");

      if (existingJobRequests.length > 0) {
        // Only allow the property used in existing job requests
        const firstJobProperty = existingJobRequests[0].property as any;
        const allowedProperty = allProperties.find(
          (p) => p._id.toString() === firstJobProperty._id.toString(),
        );

        return {
          properties: allowedProperty ? [allowedProperty] : [],
          message: "Domestic customers must use the same property as existing job requests",
        };
      } else {
        // No existing job requests, can use any property
        return {
          properties: allProperties,
          message: "First job request - you can use any property",
        };
      }
    }

    // For commercial customers - can use any property
    if (defaultPropertyType === "commercial") {
      return {
        properties: allProperties,
        message: "Commercial customers can use any property",
      };
    }

    return { properties: [], message: "Invalid property type" };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "getAllowedPropertiesForJobRequest",
      customerId,
    });
    return { properties: [], message: "Internal server error" };
  }
};

// Validate job request creation with property type enforcement
export const validateJobRequestCreation = async (
  customerId: string,
  propertyId: string,
  jobData: any,
): Promise<{ isValid: boolean; reason?: string; allowedProperties?: any[] }> => {
  try {
    // Check if customer can use this property
    const propertyCheck = await canUsePropertyForJobRequest(customerId, propertyId);

    if (!propertyCheck.canUse) {
      // Get allowed properties to show customer
      const allowedProperties = await getAllowedPropertiesForJobRequest(customerId);

      return {
        isValid: false,
        reason: propertyCheck.reason,
        allowedProperties: allowedProperties.properties,
      };
    }

    return { isValid: true };
  } catch (error) {
    logErrorWithContext(error as Error, {
      operation: "validateJobRequestCreation",
      customerId,
      propertyId,
    });
    return { isValid: false, reason: "Internal server error" };
  }
};
