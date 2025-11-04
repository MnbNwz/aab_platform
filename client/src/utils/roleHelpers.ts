import type { UserRole } from "../types";

export const isAdmin = (role: UserRole): boolean => {
  return role === "admin";
};

export const isCustomer = (role: UserRole): boolean => {
  return role === "customer";
};
export const isContractor = (role: UserRole): boolean => {
  return role === "contractor";
};

export const isNotAdmin = (role: UserRole): boolean => {
  return role !== "admin";
};

export const isAdminOrContractor = (role: UserRole): boolean => {
  return role === "admin" || role === "contractor";
};

export const isAdminOrCustomer = (role: UserRole): boolean => {
  return role === "admin" || role === "customer";
};

export const isCustomerOrContractor = (role: UserRole): boolean => {
  return role === "customer" || role === "contractor";
};
