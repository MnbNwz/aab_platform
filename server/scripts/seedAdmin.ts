import dotenv from "dotenv";
import { User } from "@models/user";
import { connectDB } from "@config/db";
import { hashPassword, validatePassword, validateEmail } from "@utils/auth";

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const adminEmail = "admin@aasquebec.com";
    const adminPassword = "Velvet!Coffee_2027-StarLamp";

    // Validate admin credentials
    if (!validateEmail(adminEmail)) {
      console.log("❌ Invalid admin email format!");
      process.exit(1);
    }

    const passwordValidation = validatePassword(adminPassword);
    if (!passwordValidation.isValid) {
      console.log(`❌ Invalid admin password: ${passwordValidation.message}`);
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      role: "admin",
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("❌ Admin user already exists!");
      process.exit(0);
    }

    // Hash password using utility
    const hashedPassword = hashPassword(adminPassword);

    // Create admin user
    const adminUser = new User({
      firstName: "System",
      lastName: "Administrator",
      email: adminEmail,
      passwordHash: hashedPassword,
      phone: "+14385270160",
      role: "admin",
      status: "active", // Admin is immediately active
      approval: "approved", // Admin is immediately approved
      profileImage: null, // Initialize profile image as null
      geoHome: {
        type: "Point",
        coordinates: [45.62691653668659, -73.83036296017089], // Montreal coordinates as default
      },
      // Admin is pre-verified (no OTP needed)
      userVerification: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        lastSentAt: null,
        canResend: false,
        cooldownSeconds: 0,
      },
      // Password reset fields (admin doesn't need these, but schema requires them)
      passwordReset: {
        token: null,
        expiresAt: null,
        lastRequestedAt: null,
      },
      // Stripe fields (admin needs Stripe integration for job payments, refunds, and contractor management)
      stripeCustomerId: null,
      stripeConnectAccountId: null,
      stripeConnectStatus: "pending",
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔒 Password: ${adminPassword}`);
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedAdmin();
}

export { seedAdmin };
