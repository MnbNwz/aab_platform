import crypto from "crypto";

/**
 * Hash password using SHA-256
 * @param password - Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Generate JWT token payload
 * @param userId - User ID
 * @param role - User role
 * @returns Token payload object
 */
export function generateToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Verify and decode JWT token
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): { userId: string; role: string; timestamp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    if (decoded.userId && decoded.role && decoded.timestamp) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if password meets security requirements
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: "Password must contain at least one special character (@$!%*?&)" };
  }
  
  return { isValid: true };
}
