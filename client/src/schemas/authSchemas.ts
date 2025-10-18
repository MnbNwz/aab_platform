import { z } from "zod";

// Base user schema
export const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must not exceed 100 characters")
    .toLowerCase()
    .transform((val) => val.trim()),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[\s.-]?[(]?[0-9]{1,4}[)]?[\s.-]?[0-9]{1,4}[\s.-]?[0-9]{1,9}$/,
      "Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
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
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s&'.,()-]+$/,
      "Company name can only contain letters, numbers, spaces, and basic punctuation"
    )
    .transform((val) => val.trim()),
  license: z
    .string()
    .min(1, "License number is required for contractors")
    .min(3, "License number must be at least 3 characters")
    .max(50, "License number must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "License number can only contain letters, numbers, and hyphens"
    )
    .transform((val) => val.trim().toUpperCase()),
  services: z
    .array(z.string())
    .min(1, "Please select at least one service")
    .max(10, "You can select up to 10 services"),
  taxId: z
    .string()
    .min(1, "Tax ID is required for contractors")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Tax ID can only contain letters, numbers, and hyphens"
    )
    .min(5, "Tax ID must be at least 5 characters")
    .max(20, "Tax ID must not exceed 20 characters")
    .transform((val) => val.trim().toUpperCase()),
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
