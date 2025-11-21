import type { ExtendedService } from "../types/service";

/**
 * Convert area from various units to square feet
 * @param area - The area value
 * @param unit - The unit of the area (sqft, sqm, marla, kanal)
 * @returns Area in square feet
 */
export const convertAreaToSqft = (
  area: number,
  unit: "sqft" | "sqm" | "marla" | "kanal"
): number => {
  if (!area || area <= 0) return 0;

  const conversionFactors: Record<string, number> = {
    sqft: 1, // Already in sqft
    sqm: 10.764, // 1 sqm = 10.764 sqft
    marla: 272.25, // 1 marla = 272.25 sqft (Pakistani standard)
    kanal: 5445, // 1 kanal = 5445 sqft (Pakistani standard, 1 kanal = 20 marlas)
  };

  return area * (conversionFactors[unit] || 1);
};

/**
 * Calculate budget based on property area and service rates
 * Formula:
 * - Base amount = area (sqft) * materialUnit * laborUnit
 * - Admin fee = 15% of base amount
 * - Profit = 25% of base amount
 * - GST = 5% (0.05) of base amount
 * - QST = 9.975% (0.09975) of base amount
 * - Final = base + admin + profit + GST + QST
 *
 * Note: This calculation is hidden from the user. The result is displayed in dollars
 * in the frontend and converted to cents when sending to the backend.
 *
 * @param area - Property area in square feet
 * @param extendedService - Extended service with materialUnit and laborUnit
 * @returns Budget in dollars (will be converted to cents when sending to backend)
 */
export const calculateBudget = (
  area: number,
  extendedService: ExtendedService | null
): number => {
  if (!area || area <= 0 || !extendedService) {
    return 0;
  }

  // Base calculation: area * materialUnit * laborUnit
  const baseAmount =
    area * extendedService.materialUnit * extendedService.laborUnit;

  // Additional fees and taxes (all calculated as percentage of base amount)
  const adminFee = baseAmount * 0.15; // Admin: 15% of base amount
  const profit = baseAmount * 0.25; // Profit: 25% of base amount
  const gst = baseAmount * 0.05; // GST: 5% (0.05) of base amount
  const qst = baseAmount * 0.09975; // QST: 9.975% (0.09975) of base amount

  // Final budget = base + all additional fees and taxes
  const finalBudget = baseAmount + adminFee + profit + gst + qst;

  // Round to 2 decimal places
  return Math.round(finalBudget * 100) / 100;
};

/**
 * Find extended service by name (case-insensitive)
 * @param serviceName - Name of the service to find
 * @param extendedServices - Array of extended services
 * @returns ExtendedService if found, null otherwise
 */
export const findExtendedService = (
  serviceName: string,
  extendedServices: ExtendedService[] | null
): ExtendedService | null => {
  if (!serviceName || !extendedServices || extendedServices.length === 0) {
    return null;
  }

  return (
    extendedServices.find(
      (service) =>
        service.name.toLowerCase().trim() === serviceName.toLowerCase().trim()
    ) || null
  );
};

/**
 * Calculate budget from property and service selection
 * @param propertyArea - Property area value
 * @param areaUnit - Property area unit
 * @param serviceName - Selected service category name
 * @param extendedServices - Array of extended services from API
 * @returns Budget in dollars, or 0 if calculation cannot be performed
 */
export const calculateBudgetFromSelection = (
  propertyArea: number | undefined,
  areaUnit: string | undefined,
  serviceName: string | undefined,
  extendedServices: ExtendedService[] | null
): number => {
  // Validate inputs
  if (!propertyArea || propertyArea <= 0) return 0;
  if (!areaUnit || !["sqft", "sqm", "marla", "kanal"].includes(areaUnit))
    return 0;
  if (!serviceName) return 0;
  if (!extendedServices || extendedServices.length === 0) return 0;

  // Convert area to square feet
  const areaInSqft = convertAreaToSqft(
    propertyArea,
    areaUnit as "sqft" | "sqm" | "marla" | "kanal"
  );

  // Find matching extended service
  const extendedService = findExtendedService(serviceName, extendedServices);
  if (!extendedService) return 0;

  // Calculate budget
  return calculateBudget(areaInSqft, extendedService);
};
