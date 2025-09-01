import crypto from "crypto";
import { User } from "../models/user";

// Hash password
function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate token
function generateToken(userId: string, role: string) {
  const payload = JSON.stringify({ userId, role, timestamp: Date.now() });
  return Buffer.from(payload).toString("base64");
}

// Verify token
export function verifyToken(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    return { userId: payload.userId, role: payload.role };
  } catch {
    throw new Error("Invalid token");
  }
}

// Clean user data (remove password)
function cleanUserData(user: any) {
  const userObj = user.toObject();
  delete userObj.passwordHash;
  return {
    ...userObj,
    _id: userObj._id.toString(),
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

  // Generate token
  const token = generateToken(user._id.toString(), user.role);

  return {
    user: cleanUserData(user),
    token,
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

  // Generate token
  const token = generateToken(user._id.toString(), user.role);

  return {
    user: cleanUserData(user),
    token,
  };
}
