import { Response, NextFunction } from "express";
import { verifyToken } from "@services/auth";
import { User } from "@models/user";
import { MIDDLEWARE_ERROR_MESSAGES, HTTP_STATUS, AUTHORIZATION_CONSTANTS } from "../constants";
import { clearAuthCookies } from "@middlewares/utils/cookies";

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // First, try to get token from cookies (preferred for security)
    if (req.cookies && req.cookies[AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE]) {
      token = req.cookies[AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE];
    }
    // Fallback to Authorization header for API compatibility
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(AUTHORIZATION_CONSTANTS.BEARER_PREFIX)
    ) {
      token = req.headers.authorization.substring(AUTHORIZATION_CONSTANTS.BEARER_PREFIX.length);
    }

    if (!token) {
      clearAuthCookies(res);
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: MIDDLEWARE_ERROR_MESSAGES.AUTHENTICATION_REQUIRED });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      clearAuthCookies(res);
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: MIDDLEWARE_ERROR_MESSAGES.INVALID_TOKEN });
      return;
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      clearAuthCookies(res);
      res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: MIDDLEWARE_ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    // if (user.status === "revoke") {
    //   res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: MIDDLEWARE_ERROR_MESSAGES.ACCOUNT_REVOKED });
    //   return;
    // }

    // Clean user data
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.favoriteContractors; // Remove favorites from profile
    req.user = { ...userObj, _id: userObj._id.toString() };

    next();
  } catch (error) {
    console.error(MIDDLEWARE_ERROR_MESSAGES.AUTHENTICATION_ERROR, error);
    clearAuthCookies(res);
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: MIDDLEWARE_ERROR_MESSAGES.INVALID_TOKEN });
  }
};
