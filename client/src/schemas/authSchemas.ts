import { z } from 'zod';

// Base user schema
const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[0-9][\d\s\-\(\)]*$/, 'Please enter a valid phone number'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
});

// Contractor specific fields schema
const contractorProfileSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required for contractors')
    .min(2, 'Business name must be at least 2 characters'),
  licenseNumber: z
    .string()
    .min(1, 'License number is required for contractors')
    .min(3, 'License number must be at least 3 characters'),
  specialties: z
    .array(z.string())
    .min(1, 'Please select at least one specialty'),
  serviceRadius: z
    .number()
    .min(1, 'Service radius must be at least 1 km')
    .max(500, 'Service radius cannot exceed 500 km'),
});

// Customer registration schema
export const customerRegistrationSchema = baseUserSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  }
);

// Contractor registration schema
export const contractorRegistrationSchema = baseUserSchema
  .merge(contractorProfileSchema)
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  );

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Type exports
export type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>;
export type ContractorRegistrationData = z.infer<typeof contractorRegistrationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
