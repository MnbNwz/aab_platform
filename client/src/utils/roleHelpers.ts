import type { UserRole } from "../types";

/**
 * Checks if a role is admin
 * @param role - The user role to check
 * @returns true if the role is admin, false otherwise
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === "admin";
};

/**
 * Checks if a role is customer
 * @param role - The user role to check
 * @returns true if the role is customer, false otherwise
 */
export const isCustomer = (role: UserRole): boolean => {
  return role === "customer";
};

/**
 * Checks if a role is contractor
 * @param role - The user role to check
 * @returns true if the role is contractor, false otherwise
 */
export const isContractor = (role: UserRole): boolean => {
  return role === "contractor";
};

/**
 * Checks if a role is NOT admin
 * @param role - The user role to check
 * @returns true if the role is not admin, false otherwise
 */
export const isNotAdmin = (role: UserRole): boolean => {
  return role !== "admin";
};

/**
 * Checks if a role is admin or contractor
 * @param role - The user role to check
 * @returns true if the role is admin or contractor, false otherwise
 */
export const isAdminOrContractor = (role: UserRole): boolean => {
  return role === "admin" || role === "contractor";
};

/**
 * Checks if a role is admin or customer
 * @param role - The user role to check
 * @returns true if the role is admin or customer, false otherwise
 */
export const isAdminOrCustomer = (role: UserRole): boolean => {
  return role === "admin" || role === "customer";
};

/**
 * Checks if a role is customer or contractor
 * @param role - The user role to check
 * @returns true if the role is customer or contractor, false otherwise
 */
export const isCustomerOrContractor = (role: UserRole): boolean => {
  return role === "customer" || role === "contractor";
};
