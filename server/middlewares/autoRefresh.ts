import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from "../utils/auth";
import { User } from "../models/user";

/**
 * Middleware that automatically handles token refresh when access token expires
 * This makes token refresh transparent to the client
 */
export const autoRefreshToken = async (req: any, res: Response, next: NextFunction) => {
  try {
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    
    // Get tokens from cookies
    if (req.cookies) {
      accessToken = req.cookies.accessToken;
      refreshToken = req.cookies.refreshToken;
    }
    
    // If no access token, try to get from headers (fallback for API clients)
    if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.substring(7);
    }

    // If we have a valid access token, continue normally
    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      if (decoded) {
        // Access token is valid - continue normally
        return next();
      }
    }

    // No access token or access token is invalid/expired
    // Try to refresh using refresh token if available
    if (refreshToken) {
      // Verify refresh token
      const refreshDecoded = verifyRefreshToken(refreshToken);
      if (!refreshDecoded) {
        // Refresh token is also invalid - clear cookies and let auth fail
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return next();
      }

      // Get user from database
      const user = await User.findById(refreshDecoded.userId);
      if (!user || user.status === "revoke") {
        // User doesn't exist or is revoked - clear cookies and let auth fail
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return next();
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user._id.toString(), user.role);
      
      // Set new access token in cookie
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Update the request cookies for the downstream middleware
      req.cookies = req.cookies || {};
      req.cookies.accessToken = newAccessToken;

      console.log(`Auto-refreshed token for user: ${user._id}`);
      
      // Continue with the refreshed token
      return next();
    }

    // No tokens available - let the regular auth middleware handle this
    next();
  } catch (error) {
    console.error("Auto-refresh error:", error);
    // Don't fail the request, let the regular auth middleware handle it
    next();
  }
};
