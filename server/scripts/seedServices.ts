import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { ContractorServices } from "@models/system";
import { connectDB } from "@config/db";
import { User } from "@models/user";

// Default contractor services
const defaultServices = ["plumbing", "electrical", "hvac", "painting", "flooring"];

export const seedServices = async () => {
  try {
    console.log("Starting services seeding...");

    // Connect to database
    await connectDB();

    // Find an admin user to use as createdBy/updatedBy
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.log("❌ No admin user found. Please run seedAdmin.ts first!");
      process.exit(1);
    }

    // Check if services already exist
    const existingServices = await ContractorServices.findOne();

    if (existingServices) {
      console.log("⚠️  Services already exist. Clearing existing services...");
      await ContractorServices.deleteMany({});
    }

    // Get the latest version number
    const latestServices = await ContractorServices.findOne()
      .sort({ version: -1 })
      .select("version");

    const newVersion = latestServices ? latestServices.version + 1 : 1;

    // Create new services document
    const contractorServices = new ContractorServices({
      services: defaultServices,
      version: newVersion,
      createdBy: adminUser._id,
      updatedBy: adminUser._id,
    });

    await contractorServices.save();

    console.log("✅ Services seeded successfully!");
    console.log(`📊 Total services: ${defaultServices.length}`);
    console.log(`🔢 Version: ${newVersion}`);
    console.log(`👤 Created by: ${adminUser.email}`);
    console.log("\n📋 Services added:");
    defaultServices.forEach((service) => {
      console.log(`  - ${service}`);
    });

    return contractorServices;
  } catch (error) {
    console.error("❌ Error seeding services:", error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await seedServices();
      console.log("\n🎉 Services seeding completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    }
  })();
}
