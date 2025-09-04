import { ContractorServices } from "../models/service";

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
      validServices: []
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
      validServices: []
    };
  }

  // Normalize both arrays for comparison
  const normalizedInput = services.map(service => service.trim().toLowerCase());
  const availableServices = latestServices.services.map(service => service.toLowerCase());
  
  // Check which services are valid/invalid
  const validServices: string[] = [];
  const invalidServices: string[] = [];

  normalizedInput.forEach(service => {
    if (availableServices.includes(service)) {
      validServices.push(service);
    } else {
      invalidServices.push(service);
    }
  });

  return {
    isValid: invalidServices.length === 0,
    invalidServices,
    validServices
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
