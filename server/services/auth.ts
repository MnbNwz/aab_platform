import { User } from "../models/user";
import { 
  hashPassword, 
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken as utilVerifyAccessToken,
  verifyToken as utilVerifyToken, 
  validateEmail, 
  validatePhone, 
  sanitizeUser 
} from "../utils/auth";

// Export the utility functions with the same name for backward compatibility
export const verifyToken = utilVerifyToken;
export const verifyAccessToken = utilVerifyAccessToken;

// Clean user data (remove password) - now using sanitizeUser utility
function cleanUserData(user: any) {
  const sanitized = sanitizeUser(user);
  return {
    ...sanitized,
    _id: sanitized._id.toString(),
  };
}

// Signup function
export async function signup(signupData: any) {
  const { email, password, phone, role, customer, contractor, geoHome } = signupData;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Create user data
  const userData: any = {
    email,
    phone,
    passwordHash: hashPassword(password),
    role,
    status: "pending",
    geoHome,
  };

  // Add profile data
  if (role === "customer" && customer && !contractor) {
    userData.customer = {
      defaultPropertyType: customer.defaultPropertyType,
      approval: "pending",
    };

    // Add optional fields if provided
    if (customer.subscriptionId) {
      userData.customer.subscriptionId = customer.subscriptionId;
    }
    if (customer.membershipId) {
      userData.customer.membershipId = customer.membershipId;
    }
  }

  if (role === "contractor" && contractor && !customer) {
    userData.contractor = {
      companyName: contractor.companyName,
      services: contractor.services,
      license: contractor.license,
      taxId: contractor.taxId,
      docs: contractor.docs,
      approval: "pending",
    };

    // Add optional fields if provided
    if (contractor.subscriptionId) {
      userData.contractor.subscriptionId = contractor.subscriptionId;
    }
    if (contractor.membershipId) {
      userData.contractor.membershipId = contractor.membershipId;
    }
  }

  // Create and save user
  const user = new User(userData);
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  return {
    user: cleanUserData(user),
    accessToken,
    refreshToken,
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

  // Check if revoked
  if (user.status === "revoke") {
    throw new Error("Account has been revoked");
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
