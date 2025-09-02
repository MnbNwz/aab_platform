import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/user";
import { connectDB } from "../config/db";
import { hashPassword, validatePassword, validateEmail } from "../utils/auth";

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const adminEmail = "admin@aasplatform.com";
    const adminPassword = "Admin@2025!Secure";
    
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
      email: adminEmail 
    });
    
    if (existingAdmin) {
      console.log("❌ Admin user already exists!");
      process.exit(0);
    }
    
    // Hash password using utility
    const hashedPassword = hashPassword(adminPassword);
    
    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      passwordHash: hashedPassword,
      phone: "+1234567000",
      role: "admin",
      status: "active", // Admin is immediately active
      geoHome: {
        type: "Point",
        coordinates: [-74.006, 40.7128] // NYC coordinates as default
      }
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
