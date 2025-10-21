import { Request, Response } from "express";
import {
  signup,
  signin,
  verifyOTPCode,
  resendOTP,
  getVerificationState,
  forgotPassword,
  resetPassword,
} from "@services/auth";
import S3Upload from "@utils/storage";
import {
  AUTHORIZATION_CONSTANTS,
  getCookieConfig,
  ENVIRONMENT_CONSTANTS,
} from "@middlewares/constants";
import { CONTROLLER_CONSTANTS, FIELD_CONSTANTS } from "@controllers/constants";
import { ENV_CONFIG } from "@config/env";

export const signupController = async (req: Request & { files?: any[] }, res: Response) => {
  try {
    const signupData = req.body;
    // If files are present (contractor docs), upload to S3 and add URLs to contractor.docs
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const s3 = S3Upload;
      const docUrls = [];
      for (const file of req.files) {
        // Use a unique key for each file (e.g., contractor_email/timestamp_filename)
        const key = `${signupData.email || Date.now()}_${file.originalname}`;
        const url = await s3.uploadFile(key, file.buffer, file.mimetype);
        docUrls.push({ name: file.originalname, url });
      }
      // Attach docs to contractor object in signupData
      if (!signupData.contractor) signupData.contractor = {};
      signupData.contractor.docs = docUrls;
    }
    const result = await signup(signupData);
    // Set tokens in HTTP-only cookies with smart configuration
    const cookieConfig = getCookieConfig(ENV_CONFIG.SECURE_COOKIES);
    res.cookie(AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.cookie(AUTHORIZATION_CONSTANTS.REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(201).json({
      message: result.message,
      user: result.user,
      userVerification: result.userVerification,
      // Don't send tokens in response body for security
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Signup failed",
    });
  }
};

export const signinController = async (req: Request, res: Response) => {
  try {
    const result = await signin(req.body);

    // Set tokens in HTTP-only cookies with smart configuration
    const cookieConfig = getCookieConfig(ENV_CONFIG.SECURE_COOKIES);
    res.cookie(AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE, result.accessToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie(AUTHORIZATION_CONSTANTS.REFRESH_TOKEN_COOKIE, result.refreshToken, {
      ...cookieConfig,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      message: "Login successful",
      user: result.user,
      // Don't send tokens in response body for security
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || "Login failed",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Clear the authentication cookies
  res.clearCookie(AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: ENV_CONFIG.SECURE_COOKIES,
    sameSite: ENVIRONMENT_CONSTANTS.COOKIE_SAMESITE,
    domain: ENV_CONFIG.COOKIE_DOMAIN,
  });

  res.clearCookie(AUTHORIZATION_CONSTANTS.REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: ENV_CONFIG.SECURE_COOKIES,
    sameSite: ENVIRONMENT_CONSTANTS.COOKIE_SAMESITE,
    domain: ENV_CONFIG.COOKIE_DOMAIN,
  });

  res.status(200).json({
    message: "Logout successful",
  });
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: CONTROLLER_CONSTANTS.UNAUTHORIZED_MESSAGE });
      return;
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({
      error: error.message || "Failed to get profile",
    });
  }
};

// OTP verification controller
export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        error: "Email and OTP code are required",
      });
    }

    const result = await verifyOTPCode(email, otpCode);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "OTP verification failed",
    });
  }
};

// Resend OTP controller
export const resendOTPController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const result = await resendOTP(email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to resend OTP",
    });
  }
};

// Get verification state controller
export const getVerificationStateController = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== FIELD_CONSTANTS.STRING_TYPE) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const result = await getVerificationState(email as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to get verification state",
    });
  }
};

// Forgot password controller
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const result = await forgotPassword(email as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to process password reset request",
    });
  }
};

// Reset password controller
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Reset token and new password are required",
      });
    }

    const result = await resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || "Failed to reset password",
    });
  }
};
