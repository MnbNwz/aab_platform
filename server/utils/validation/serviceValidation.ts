import { ContractorServices } from "@models/system";
import { normalizeServices, filterValidServicesWithNormalized } from "./serviceUtils";

/**
 * Validates that the provided services exist in the current services table
 * @param services - Array of service names to validate
 * @returns Promise<{ isValid: boolean, invalidServices: string[], validServices: string[] }>
 */
export async function validateContractorServices(services: string[]): Promise<{
  isValid: boolean;
  invalidServices: string[];
  validServices: string[];
}> {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return {
      isValid: false,
      invalidServices: [],
      validServices: [],
    };
  }

  // Get the latest services document
  const latestServices = await ContractorServices.findOne()
    .sort({ version: -1 })
    .select("services");

  if (!latestServices || !latestServices.services) {
    return {
      isValid: false,
      invalidServices: services,
      validServices: [],
    };
  }

  // Normalize both arrays for comparison (optimized utility)
  const normalizedInput = normalizeServices(services);
  const normalizedAvailable = normalizeServices(latestServices.services);

  // Use optimized utility to filter valid services (avoid double normalization)
  const validServices = filterValidServicesWithNormalized(normalizedInput, normalizedAvailable);

  // Calculate invalid services using Set difference - no iteration
  const validSet = new Set(validServices);
  const inputSet = new Set(normalizedInput);
  const invalidServices = Array.from(inputSet).filter((service) => !validSet.has(service));

  return {
    isValid: invalidServices.length === 0,
    invalidServices,
    validServices,
  };
}

/**
 * Gets the current list of available contractor services
 * @returns Promise<string[]> - Array of available service names
 */
export async function getAvailableServices(): Promise<string[]> {
  const latestServices = await ContractorServices.findOne()
    .sort({ version: -1 })
    .select("services");

  return latestServices?.services || [];
}
