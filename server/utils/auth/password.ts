import crypto from "crypto";
import jwt from "jsonwebtoken";
import { validatePassword as validatePasswordLib } from "@utils/validation";

/**
 * Hash password using SHA-256
 * @param password - Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Generate crypto-secure random timestamp offset
 * @returns Random offset in seconds (0-300 seconds = 0-5 minutes)
 */
function getSecureRandomOffset(): number {
  const randomBytes = crypto.randomBytes(2);
  return randomBytes.readUInt16BE(0) % 301; // 0-300 seconds
}

/**
 * Generate access token with proper cryptographic signing and random timing
 * @param userId - User ID
 * @param role - User role
 * @returns Signed JWT access token
 */
export function generateAccessToken(userId: string, role: string): string {
  const now = Math.floor(Date.now() / 1000);
  const randomOffset = getSecureRandomOffset();

  const payload = {
    userId,
    role,
    type: "access",
    iat: now + randomOffset, // Add random offset to make timing unpredictable
    exp: now + 7 * 24 * 60 * 60, // Expires in 7 days - this is fine for JWT timestamps
    jti: crypto.randomUUID(), // Unique token ID for tracking/revocation
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    issuer: "aas-platform",
    audience: "aas-users",
  });
}

/**
 * Generate refresh token with longer expiry
 * @param userId - User ID
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const randomOffset = getSecureRandomOffset();

  const payload = {
    userId,
    type: "refresh",
    iat: now + randomOffset,
    exp: now + 30 * 24 * 60 * 60, // Expires in 30 days
    jti: crypto.randomUUID(),
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    issuer: "aas-platform",
    audience: "aas-users",
  });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateAccessToken instead
 */
export function generateToken(userId: string, role: string): string {
  return generateAccessToken(userId, role);
}

/**
 * Verify and decode access token with cryptographic verification
 * @param token - JWT access token
 * @returns Decoded payload or null if invalid
 */
export function verifyAccessToken(
  token: string,
): { userId: string; role: string; type: string; iat: number; exp: number; jti: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "aas-platform",
      audience: "aas-users",
    }) as any;

    if (decoded.userId && decoded.type === "access") {
      return {
        userId: decoded.userId,
        role: decoded.role,
        type: decoded.type,
        iat: decoded.iat,
        exp: decoded.exp,
        jti: decoded.jti,
      };
    }
    return null;
  } catch (error) {
    console.error("Access token verification failed:", error.message);
    return null;
  }
}

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token
 * @returns Decoded payload or null if invalid
 */
export function verifyRefreshToken(
  token: string,
): { userId: string; type: string; iat: number; exp: number; jti: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "aas-platform",
      audience: "aas-users",
    }) as any;

    if (decoded.userId && decoded.type === "refresh") {
      return {
        userId: decoded.userId,
        type: decoded.type,
        iat: decoded.iat,
        exp: decoded.exp,
        jti: decoded.jti,
      };
    }
    return null;
  } catch (error) {
    console.error("Refresh token verification failed:", error.message);
    return null;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use verifyAccessToken instead
 */
export function verifyToken(
  token: string,
): { userId: string; role: string; iat: number; exp: number } | null {
  const result = verifyAccessToken(token);
  if (result) {
    return {
      userId: result.userId,
      role: result.role,
      iat: result.iat,
      exp: result.exp,
    };
  }
  return null;
}

/**
 * Check if password meets security requirements using zxcvbn
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
  score?: number;
} {
  return validatePasswordLib(password);
}
