/**
 * Centralized constants for the application
 *
 * This file contains all static data that can be shared across components.
 * All constants are memoized and exported in a consistent way to ensure:
 * 1. Single source of truth for static data
 * 2. Type safety with TypeScript
 * 3. Proper memoization to prevent unnecessary re-renders
 * 4. Easy maintenance and updates
 *
 * @example
 * // Using constants directly:
 * import { USER_ROLES, PROPERTY_TYPES } from '@/constants';
 *
 * // Using memoized hooks in React components:
 * import { useProvinces, useUserRoles } from '@/constants';
 *
 * function MyComponent() {
 *   const provinces = useProvinces(true); // memoized, only common provinces
 *   const roles = useUserRoles(); // memoized
 *   return <select>{provinces.map(p => <option>{p}</option>)}</select>;
 * }
 *
 * @example
 * // For FilterPanel integration:
 * import { FilterConfigs } from '@/components/ui/FilterPanel.utils';
 * import { SORT_OPTIONS } from '@/constants';
 *
 * // All FilterConfigs now use centralized constants automatically
 * const fields = [
 *   FilterConfigs.userRole(roleValue),
 *   FilterConfigs.propertyType(typeValue),
 * ];
 */

import { useMemo } from "react";

// ============================================================================
// Canadian Provinces and Territories
// ============================================================================
export const CANADIAN_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

export type CanadianProvince = (typeof CANADIAN_PROVINCES)[number];

// Common provinces (most used)
export const COMMON_PROVINCES = [
  "Quebec",
  "Ontario",
  "British Columbia",
  "Alberta",
] as const;

// ============================================================================
// User Roles
// ============================================================================
export const USER_ROLES = ["admin", "customer", "contractor"] as const;

export type UserRoleType = (typeof USER_ROLES)[number];

// ============================================================================
// User Status
// ============================================================================
export const USER_STATUSES = ["pending", "active", "revoke"] as const;

export type UserStatusType = (typeof USER_STATUSES)[number];

// ============================================================================
// User Approval Status
// ============================================================================
export const USER_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type UserApprovalType = (typeof USER_APPROVAL_STATUSES)[number];

// ============================================================================
// Property Types
// ============================================================================
export const PROPERTY_TYPES = [
  "house",
  "duplex",
  "triplex",
  "sixplex",
  "land",
  "commercial",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

// ============================================================================
// Investment Status
// ============================================================================
export const INVESTMENT_STATUSES = [
  "available",
  "under_offer",
  "sold",
] as const;

export type InvestmentStatusType = (typeof INVESTMENT_STATUSES)[number];

// ============================================================================
// Contact Status
// ============================================================================
export const CONTACT_STATUSES = ["pending", "accepted", "rejected"] as const;

export type ContactStatusType = (typeof CONTACT_STATUSES)[number];

// ============================================================================
// Payment Status
// ============================================================================
export const PAYMENT_STATUSES = [
  "succeeded",
  "pending",
  "failed",
  "refunded",
] as const;

export type PaymentStatusType = (typeof PAYMENT_STATUSES)[number];

// ============================================================================
// Payment Types
// ============================================================================
export const PAYMENT_TYPES = ["membership", "job"] as const;

export type PaymentTypeEnum = (typeof PAYMENT_TYPES)[number];

// ============================================================================
// Services
// ============================================================================

// ============================================================================
// Membership Plan Tiers
// ============================================================================
export const MEMBERSHIP_TIERS = ["basic", "standard", "premium"] as const;

export type MembershipTierType = (typeof MEMBERSHIP_TIERS)[number];

// ============================================================================
// Job Status
// ============================================================================
export const JOB_STATUSES = [
  "open",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobStatusType = (typeof JOB_STATUSES)[number];

// ============================================================================
// Bid Status
// ============================================================================
export const BID_STATUSES = ["pending", "accepted", "rejected"] as const;

export type BidStatusType = (typeof BID_STATUSES)[number];

// ============================================================================
// Sort Options
// ============================================================================
export const SORT_OPTIONS = [
  { label: "Created Date", value: "createdAt" },
  { label: "Updated Date", value: "updatedAt" },
  { label: "Email", value: "email" },
  { label: "Name", value: "name" },
  { label: "Price", value: "price" },
] as const;

export const SORT_ORDER_OPTIONS = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
] as const;

// ============================================================================
// Yes/No Options
// ============================================================================
export const YES_NO_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
] as const;

// ============================================================================
// Boolean Options
// ============================================================================
export const BOOLEAN_OPTIONS = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
] as const;

// ============================================================================
// React Hooks for Memoized Access
// ============================================================================

/**
 * Hook to get memoized provinces
 * @param commonOnly - If true, returns only common provinces
 */
export const useProvinces = (commonOnly: boolean = false) => {
  return useMemo(
    () => (commonOnly ? COMMON_PROVINCES : CANADIAN_PROVINCES),
    [commonOnly]
  );
};

/**
 * Hook to get memoized user roles
 */
export const useUserRoles = () => {
  return useMemo(() => USER_ROLES, []);
};

/**
 * Hook to get memoized property types
 */
export const usePropertyTypes = () => {
  return useMemo(() => PROPERTY_TYPES, []);
};

/**
 * Hook to get memoized payment statuses
 */
export const usePaymentStatuses = () => {
  return useMemo(() => PAYMENT_STATUSES, []);
};

/**
 * Hook to get memoized investment statuses
 */
export const useInvestmentStatuses = () => {
  return useMemo(() => INVESTMENT_STATUSES, []);
};

/**
 * Hook to get memoized user approval statuses
 */
export const useUserApprovalStatuses = () => {
  return useMemo(() => USER_APPROVAL_STATUSES, []);
};

/**
 * Hook to get memoized job statuses
 */
export const useJobStatuses = () => {
  return useMemo(() => JOB_STATUSES, []);
};

/**
 * Hook to get memoized bid statuses
 */
export const useBidStatuses = () => {
  return useMemo(() => BID_STATUSES, []);
};

/**
 * Hook to get memoized sort options
 */
export const useSortOptions = () => {
  return useMemo(() => SORT_OPTIONS, []);
};

/**
 * Hook to get memoized yes/no options
 */
export const useYesNoOptions = () => {
  return useMemo(() => YES_NO_OPTIONS, []);
};

/**
 * Hook to get memoized boolean options
 */
export const useBooleanOptions = () => {
  return useMemo(() => BOOLEAN_OPTIONS, []);
};

// ============================================================================
// Helper Functions for Converting to Filter Options
// ============================================================================

/**
 * Convert a string array to filter options format
 */
export const toFilterOptions = <T extends string>(
  items: readonly T[]
): Array<{ label: string; value: string }> => {
  return items.map((item) => ({ label: item, value: item }));
};

/**
 * Convert provinces to filter options
 */
export const provincesToFilterOptions = (commonOnly: boolean = false) => {
  const provinces = commonOnly ? COMMON_PROVINCES : CANADIAN_PROVINCES;
  return toFilterOptions(provinces);
};

/**
 * Convert string arrays to filter options (already formatted)
 */
export const arrayToFilterOptions = <T extends string>(
  items: readonly T[]
): Array<{ label: string; value: string }> => {
  return toFilterOptions(items);
};
