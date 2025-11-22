import type { FilterField, FilterOption } from "./FilterPanel";
import {
  USER_ROLES,
  USER_APPROVAL_STATUSES,
  INVESTMENT_STATUSES,
  PROPERTY_TYPES,
  CONTACT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  SORT_ORDER_OPTIONS,
  YES_NO_OPTIONS,
  BOOLEAN_OPTIONS,
} from "../../constants";

/**
 * Helper function to create a select field with options
 */
export function createSelectField(
  name: string,
  label: string,
  options:
    | string[]
    | readonly string[]
    | FilterOption[]
    | readonly FilterOption[],
  value: any,
  placeholder?: string
): FilterField {
  // If options are strings, convert to FilterOption format
  const formattedOptions: FilterOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  });

  return {
    name,
    label,
    type: "select",
    value,
    options: formattedOptions,
    placeholder,
  };
}

/**
 * Helper function to create a select field with "All" option
 */
export function createSelectFieldWithAll(
  name: string,
  label: string,
  options:
    | readonly string[]
    | string[]
    | readonly FilterOption[]
    | FilterOption[],
  value: any,
  allLabel: string = "All"
): FilterField {
  const formattedOptions: FilterOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  });

  return {
    name,
    label,
    type: "select",
    value,
    options: [{ label: allLabel, value: "" }, ...formattedOptions],
  };
}

/**
 * Helper function to create an input field
 */
export function createInputField(
  name: string,
  label: string,
  value: any,
  placeholder?: string
): FilterField {
  return {
    name,
    label,
    type: "input",
    value,
    placeholder,
  };
}

/**
 * Helper function to create a number field
 */
export function createNumberField(
  name: string,
  label: string,
  value: any,
  placeholder?: string
): FilterField {
  return {
    name,
    label,
    type: "number",
    value,
    placeholder,
  };
}

/**
 * Helper function to create a date field
 */
export function createDateField(
  name: string,
  label: string,
  value: any
): FilterField {
  return {
    name,
    label,
    type: "date",
    value,
  };
}

/**
 * Common filter field presets
 */
export const CommonFilterFields = {
  // Status filters
  status: (value: any, statuses: string[] = ["pending", "active", "revoked"]) =>
    createSelectFieldWithAll("status", "Status", statuses, value),

  // Sort by filters
  sortBy: (value: any, options: { label: string; value: string }[]) =>
    createSelectField("sortBy", "Sort By", options, value),

  // Yes/No filters
  yesNo: (name: string, label: string, value: any) =>
    createSelectFieldWithAll(name, label, YES_NO_OPTIONS, value),

  // Boolean filters
  boolean: (name: string, label: string, value: any) =>
    createSelectFieldWithAll(name, label, BOOLEAN_OPTIONS, value),
};

/**
 * Pre-configured filter sets for common use cases
 */
export const FilterConfigs = {
  /**
   * Payment status filter
   */
  paymentStatus: (value: any) =>
    createSelectFieldWithAll("status", "Status", PAYMENT_STATUSES, value),

  /**
   * User role filter
   */
  userRole: (value: any) =>
    createSelectFieldWithAll("role", "Role", USER_ROLES, value),

  /**
   * User approval filter
   */
  userApproval: (value: any) =>
    createSelectFieldWithAll(
      "approval",
      "Approval",
      USER_APPROVAL_STATUSES,
      value
    ),

  /**
   * Investment property status filter
   */
  investmentStatus: (value: any) =>
    createSelectFieldWithAll("status", "Status", INVESTMENT_STATUSES, value),

  /**
   * Property type filter
   */
  propertyType: (value: any) =>
    createSelectFieldWithAll(
      "propertyType",
      "Property Type",
      PROPERTY_TYPES,
      value
    ),

  /**
   * Contact status filter
   */
  contactStatus: (value: any) =>
    createSelectFieldWithAll(
      "contactStatus",
      "Contact Status",
      CONTACT_STATUSES,
      value
    ),

  /**
   * Sort order filter
   */
  sortOrder: (value: any = "desc") =>
    createSelectField("sortOrder", "Sort Order", SORT_ORDER_OPTIONS, value),

  /**
   * Payment type filter
   */
  paymentType: (value: any) =>
    createSelectFieldWithAll("type", "Type", PAYMENT_TYPES, value),
};
