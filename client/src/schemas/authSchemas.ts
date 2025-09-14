import { z } from "zod";

// Base user schema
export const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\+]?[0-9][\d\s\-\(\)]*$/, "Please enter a valid phone number"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  // Add geoHome fields
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z
    .number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
});

// Customer specific fields schema
const customerProfileSchema = z.object({
  defaultPropertyType: z.enum(["domestic", "commercial"]).default("domestic"),
});

// Contractor specific fields schema
const contractorProfileSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required for contractors")
    .min(2, "Company name must be at least 2 characters"),
  license: z
    .string()
    .min(1, "License number is required for contractors")
    .min(3, "License number must be at least 3 characters"),
  services: z.array(z.string()).min(1, "Please select at least one service"),
  taxId: z.string().min(1, "Tax ID is required for contractors"),
  // serviceRadius removed
});

// Customer registration schema
export const customerRegistrationSchema = baseUserSchema
  .merge(customerProfileSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

// Contractor registration schema
export const contractorRegistrationSchema = baseUserSchema
  .merge(contractorProfileSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type CustomerRegistrationData = z.infer<
  typeof customerRegistrationSchema
>;
export type ContractorRegistrationData = z.infer<
  typeof contractorRegistrationSchema
>;
export type LoginData = z.infer<typeof loginSchema>;
