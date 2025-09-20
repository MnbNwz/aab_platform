import validator from "validator";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import zxcvbn from "zxcvbn";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create DOMPurify instance for server-side use
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

/**
 * Comprehensive validation utilities using proper libraries
 * Replaces all manual validation functions across the system
 */

// EMAIL VALIDATION
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email || typeof email !== "string") {
    return { isValid: false, message: "Email is required" };
  }

  if (!validator.isEmail(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  if (!validator.isLength(email, { max: 254 })) {
    return { isValid: false, message: "Email is too long" };
  }

  return { isValid: true };
};

// PHONE VALIDATION
export const validatePhone = (
  phone: string,
  country: string = "US",
): { isValid: boolean; message?: string } => {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, message: "Phone number is required" };
  }

  try {
    const isValid = isValidPhoneNumber(phone, country as any);
    if (!isValid) {
      return { isValid: false, message: "Invalid phone number format" };
    }

    const phoneNumber = parsePhoneNumber(phone, country as any);
    if (!phoneNumber) {
      return { isValid: false, message: "Could not parse phone number" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: "Invalid phone number format" };
  }
};

// PASSWORD VALIDATION WITH ZXCVBN
export const validatePassword = (
  password: string,
): { isValid: boolean; message?: string; score?: number } => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }

  if (password.length > 128) {
    return { isValid: false, message: "Password must be less than 128 characters" };
  }

  // Use zxcvbn for password strength analysis
  const result = zxcvbn(password);

  if (result.score < 3) {
    return {
      isValid: false,
      message: `Password is too weak. ${result.feedback.suggestions.join(" ")}`,
      score: result.score,
    };
  }

  return { isValid: true, score: result.score };
};

// STRING SANITIZATION
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove HTML tags and XSS
  const sanitized = purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Trim and normalize whitespace
  return validator.trim(sanitized);
};

// TEXT VALIDATION
export const validateText = (
  text: string,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    allowEmpty?: boolean;
  } = {},
): { isValid: boolean; message?: string } => {
  const { minLength = 0, maxLength = 1000, required = true, allowEmpty = false } = options;

  if (required && (!text || text.trim().length === 0)) {
    return { isValid: false, message: "This field is required" };
  }

  if (!allowEmpty && text && text.trim().length === 0) {
    return { isValid: false, message: "This field cannot be empty" };
  }

  if (text && text.length < minLength) {
    return { isValid: false, message: `Must be at least ${minLength} characters` };
  }

  if (text && text.length > maxLength) {
    return { isValid: false, message: `Must be no more than ${maxLength} characters` };
  }

  return { isValid: true };
};

// NUMBER VALIDATION
export const validateNumber = (
  value: any,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {},
): { isValid: boolean; message?: string; value?: number } => {
  const { min, max, integer = false, positive = false } = options;

  if (value === null || value === undefined || value === "") {
    return { isValid: false, message: "Number is required" };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, message: "Must be a valid number" };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, message: "Must be a whole number" };
  }

  if (positive && num <= 0) {
    return { isValid: false, message: "Must be a positive number" };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, message: `Must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, message: `Must be no more than ${max}` };
  }

  return { isValid: true, value: num };
};

// URL VALIDATION
export const validateUrl = (url: string): { isValid: boolean; message?: string } => {
  if (!url || typeof url !== "string") {
    return { isValid: false, message: "URL is required" };
  }

  if (
    !validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
      require_valid_protocol: true,
    })
  ) {
    return { isValid: false, message: "Invalid URL format" };
  }

  return { isValid: true };
};

// ARRAY VALIDATION
export const validateArray = (
  arr: any,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    itemValidator?: (item: any) => { isValid: boolean; message?: string };
  } = {},
): { isValid: boolean; message?: string } => {
  const { minLength = 0, maxLength = 1000, required = true, itemValidator } = options;

  if (required && (!Array.isArray(arr) || arr.length === 0)) {
    return { isValid: false, message: "Array is required and cannot be empty" };
  }

  if (!Array.isArray(arr)) {
    return { isValid: false, message: "Must be an array" };
  }

  if (arr.length < minLength) {
    return { isValid: false, message: `Must have at least ${minLength} items` };
  }

  if (arr.length > maxLength) {
    return { isValid: false, message: `Must have no more than ${maxLength} items` };
  }

  if (itemValidator) {
    for (let i = 0; i < arr.length; i++) {
      const result = itemValidator(arr[i]);
      if (!result.isValid) {
        return { isValid: false, message: `Item ${i + 1}: ${result.message}` };
      }
    }
  }

  return { isValid: true };
};

// OBJECT ID VALIDATION
export const validateObjectId = (id: string): { isValid: boolean; message?: string } => {
  if (!id || typeof id !== "string") {
    return { isValid: false, message: "ID is required" };
  }

  if (!validator.isMongoId(id)) {
    return { isValid: false, message: "Invalid ID format" };
  }

  return { isValid: true };
};

// COMPREHENSIVE INPUT VALIDATION
export const validateInput = (
  input: any,
  rules: {
    type: "string" | "number" | "email" | "phone" | "url" | "array" | "objectId";
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    country?: string;
  },
): { isValid: boolean; message?: string; value?: any } => {
  const { type, required = true, ...options } = rules;

  if (required && (input === null || input === undefined || input === "")) {
    return { isValid: false, message: "This field is required" };
  }

  switch (type) {
    case "string": {
      const textResult = validateText(input, options);
      return textResult;
    }

    case "number":
      return validateNumber(input, options);

    case "email":
      return validateEmail(input);

    case "phone":
      return validatePhone(input, options.country);

    case "url":
      return validateUrl(input);

    case "array":
      return validateArray(input, options);

    case "objectId":
      return validateObjectId(input);

    default:
      return { isValid: false, message: "Invalid validation type" };
  }
};

// BULK VALIDATION
export const validateBulk = (
  data: Record<string, any>,
  rules: Record<string, any>,
): {
  isValid: boolean;
  errors: Record<string, string>;
  data: Record<string, any>;
} => {
  const errors: Record<string, string> = {};
  const validatedData: Record<string, any> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const result = validateInput(data[field], rule);

    if (!result.isValid) {
      errors[field] = result.message || "Invalid value";
    } else {
      validatedData[field] = result.value !== undefined ? result.value : data[field];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData,
  };
};
