import { User } from "@models/user";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken as utilVerifyAccessToken,
  verifyToken as utilVerifyToken,
  validateEmail,
  validatePhone,
  sanitizeUser,
} from "@utils/auth";
import { validatePassword } from "@utils/validation";
import { validateContractorServices } from "@utils/validation";
import {
  createInitialVerification,
  updateVerificationForResend,
  verifyOTPAndUpdate,
  getVerificationStatus,
} from "@utils/auth";
import {
  createPasswordResetData,
  clearPasswordResetData,
  canRequestPasswordReset,
  getPasswordResetCooldownTime,
  isPasswordResetExpired,
  generatePasswordResetUrl,
} from "@utils/auth";
import { sendEmail } from "@utils/email";

// Export the utility functions with the same name for backward compatibility
export const verifyToken = utilVerifyToken;
export const verifyAccessToken = utilVerifyAccessToken;

// Clean user data (remove password) - now using sanitizeUser utility
function cleanUserData(user: any) {
  const sanitized = sanitizeUser(user);

  // Sanitize userVerification to remove sensitive OTP data
  let cleanUserVerification = null;
  if (user.userVerification) {
    cleanUserVerification = getVerificationStatus(user.userVerification);
  }

  return {
    ...sanitized,
    _id: sanitized._id.toString(),
    userVerification: cleanUserVerification,
  };
}

// Signup function
export async function signup(signupData: any) {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    role,
    customer,
    contractor,
    geoHome,
    profileImage,
  } = signupData;

  // Validate required fields
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Create user verification object
  const userVerification = createInitialVerification();

  // Create user data
  const userData: any = {
    firstName,
    lastName,
    email,
    phone,
    passwordHash: hashPassword(password),
    role,
    status: "pending",
    approval: "pending", // Approval is now at user level
    geoHome,
    profileImage: profileImage || null, // Always include profileImage field
    // User verification object
    userVerification,
    // Initialize Stripe fields
    stripeCustomerId: null,
    stripeConnectAccountId: null,
    stripeConnectStatus: "pending",
  };

  // Add profile data
  if (role === "customer" && customer && !contractor) {
    userData.customer = {
      defaultPropertyType: customer.defaultPropertyType,
    };
  }

  if (role === "contractor" && contractor && !customer) {
    // Validate contractor services against available services
    const serviceValidation = await validateContractorServices(contractor.services);

    if (!serviceValidation.isValid) {
      throw new Error(
        `Invalid services provided: ${serviceValidation.invalidServices.join(", ")}. ` +
          `Available services can be retrieved from /api/services endpoint.`,
      );
    }

    userData.contractor = {
      companyName: contractor.companyName,
      services: serviceValidation.validServices, // Use normalized valid services
      license: contractor.license,
      taxId: contractor.taxId,
      docs: contractor.docs || [],
    };
  }

  // Create and save user
  const user = new User(userData);
  await user.save();

  // Send OTP email
  try {
    await sendEmail(email, "Verify Your Email - AAS Platform", "otp_verification", {
      otpCode: userVerification.otpCode,
      firstName,
    });
  } catch (emailError) {
    console.error("Failed to send OTP email:", emailError);
    // Don't fail signup if email fails, just log it
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Get verification status for response
  const verificationStatus = getVerificationStatus(user.userVerification);

  return {
    user: cleanUserData(user),
    accessToken,
    refreshToken,
    message: "User created successfully. Please check your email for verification code.",
    userVerification: verificationStatus,
  };
}

// Signin function
export async function signin(signinData: any) {
  const { email, password } = signinData;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check password
  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  return {
    user: cleanUserData(user),
    accessToken,
    refreshToken,
  };
}

// Update user profile
export async function updateProfile(userId: string, updateData: any) {
  // Only allow certain fields to be updated
  const { ALLOWED_USER_UPDATE_FIELDS } = await import("../constants/validation");
  const allowedUpdates = ALLOWED_USER_UPDATE_FIELDS;

  const updates: any = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  // Optionally allow password change
  if (updateData.password) {
    updates.passwordHash = hashPassword(updateData.password);
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
}

// OTP verification function
export async function verifyOTPCode(email: string, otpCode: string) {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Verify OTP using the utility function
  const { success, updatedVerification } = verifyOTPAndUpdate(user.userVerification, otpCode);

  if (!success) {
    throw new Error("Invalid or expired OTP code");
  }

  // Update user verification and status
  user.userVerification = updatedVerification;
  user.status = "active"; // Activate user after email verification
  await user.save();

  // Clear OTP data from memory (additional security)
  user.userVerification.otpCode = null;
  user.userVerification.otpExpiresAt = null;
  user.userVerification.lastSentAt = null;

  return {
    message: "Email verified successfully! You can now sign in.",
    user: cleanUserData(user),
    userVerification: getVerificationStatus(user.userVerification),
  };
}

// Resend OTP function
export async function resendOTP(email: string) {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is already verified
  if (user.userVerification.isVerified) {
    throw new Error("Email is already verified");
  }

  // Update verification for resend
  const updatedVerification = updateVerificationForResend(user.userVerification, 1);

  // Check if still in cooldown
  if (!updatedVerification.canResend) {
    throw new Error(
      `Please wait ${updatedVerification.cooldownSeconds} seconds before requesting a new verification code.`,
    );
  }

  // Update user with new verification
  user.userVerification = updatedVerification;
  await user.save();

  // Send new OTP email
  try {
    await sendEmail(email, "New Verification Code - AAS Platform", "otp_verification", {
      otpCode: updatedVerification.otpCode,
      firstName: user.firstName,
    });
  } catch (emailError) {
    console.error("Failed to send OTP email:", emailError);
    throw new Error("Failed to send verification email. Please try again.");
  }

  return {
    message: "New verification code sent to your email.",
    userVerification: getVerificationStatus(user.userVerification),
  };
}

// Get verification state function
export async function getVerificationState(email: string) {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // Get verification status
  const verificationStatus = getVerificationStatus(user.userVerification);

  return {
    email: user.email,
    firstName: user.firstName,
    ...verificationStatus,
  };
}

// Forgot password function
export async function forgotPassword(email: string) {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not for security
    return {
      message: "If an account with this email exists, you will receive a password reset link.",
    };
  }

  // Check if user's email is verified (requirement)
  if (!user.userVerification.isVerified) {
    throw new Error("Please verify your email address first before requesting a password reset.");
  }

  // Check rate limiting (5 minutes cooldown)
  const { AUTH_COOLDOWN_MINUTES } = await import("../constants/validation");
  const cooldownMinutes = AUTH_COOLDOWN_MINUTES;
  if (!canRequestPasswordReset(user.passwordReset.lastRequestedAt, cooldownMinutes)) {
    const remainingSeconds = getPasswordResetCooldownTime(
      user.passwordReset.lastRequestedAt,
      cooldownMinutes,
    );
    throw new Error(
      `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before requesting another password reset.`,
    );
  }

  // Create password reset data
  const passwordResetData = createPasswordResetData();

  // Update user with password reset data
  user.passwordReset = passwordResetData;
  await user.save();

  // Send password reset email
  try {
    const resetUrl = generatePasswordResetUrl(passwordResetData.token);
    await sendEmail(email, "🔒 Password Reset - AAS Platform", "password_reset", {
      firstName: user.firstName,
      resetUrl,
      token: passwordResetData.token,
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    throw new Error("Failed to send password reset email. Please try again.");
  }

  return {
    message: "Password reset link has been sent to your email.",
  };
}

// Reset password function
export async function resetPassword(token: string, newPassword: string) {
  // Find user by reset token
  const user = await User.findOne({
    "passwordReset.token": token,
  });

  if (!user) {
    throw new Error("Invalid or expired password reset token.");
  }

  // Check if token is expired
  if (isPasswordResetExpired(user.passwordReset.expiresAt)) {
    throw new Error("Password reset token has expired. Please request a new one.");
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(`Invalid password: ${passwordValidation.message}`);
  }

  // Update password and clear reset data
  user.passwordHash = hashPassword(newPassword);
  user.passwordReset = clearPasswordResetData();
  await user.save();

  return {
    message: "Password reset successfully! You can now sign in with your new password.",
    user: cleanUserData(user),
  };
}
