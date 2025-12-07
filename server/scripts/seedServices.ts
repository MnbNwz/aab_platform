import dotenv from "dotenv";
dotenv.config();

import { ContractorServices, ContractorServicesExtended } from "@models/system";
import { connectDB } from "@config/db";
import { User } from "@models/user";

// Default contractor services
const defaultServices = [
  "Plumbing rough-in",
  "Electrical rough-in",
  "Demolition",
  "Drywall",
  "Insulation",
  "Painting",
  "Flooring",
  "Finishing (trim & doors)",
  "Excavation",
  "Concrete",
  "Roofing",
  "Windows & Doors",
  "Cabinetry / Millwork",
  "Landscaping",
];

// Service extended data from Excel table
const serviceExtendedData = [
  {
    name: "Plumbing rough-in",
    materialUnit: 1.5,
    laborUnit: 3,
    comment: "Average per",
  },
  {
    name: "Electrical rough-in",
    materialUnit: 1.2,
    laborUnit: 2.8,
    comment: "Average per",
  },
  {
    name: "Demolition",
    materialUnit: 2.5,
    laborUnit: 1.5,
    comment: "Interior selective",
  },
  {
    name: "Drywall",
    materialUnit: 0.9,
    laborUnit: 1.8,
    comment: "Drywall board",
  },
  {
    name: "Insulation",
    materialUnit: 0.8,
    laborUnit: 0.9,
    comment: "Batt or blow",
  },
  {
    name: "Painting",
    materialUnit: 0.7,
    laborUnit: 1.2,
    comment: "Primer + 2 coats",
  },
  {
    name: "Flooring",
    materialUnit: 3,
    laborUnit: 1.5,
    comment: "Vinyl plank",
  },
  {
    name: "Finishing (trim & doors)",
    materialUnit: 1,
    laborUnit: 2,
    comment: "Per sq.ft. floor",
  },
  {
    name: "Excavation",
    materialUnit: 2.5,
    laborUnit: 4.5,
    comment: "Per sq.ft. footprint",
  },
  {
    name: "Concrete",
    materialUnit: 4,
    laborUnit: 3,
    comment: "Slab or pad",
  },
  {
    name: "Roofing",
    materialUnit: 3,
    laborUnit: 2.5,
    comment: "Shingles, per square",
  },
  {
    name: "Windows & Doors",
    materialUnit: 150,
    laborUnit: 200,
    comment: "Per unit opening",
  },
  {
    name: "Cabinetry / Millwork",
    materialUnit: 75,
    laborUnit: 150,
    comment: "Per linear foot",
  },
  {
    name: "Landscaping",
    materialUnit: 3,
    laborUnit: 3,
    comment: "Per sq.ft. treated",
  },
];

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

    // Seed Contractor Services Extended
    console.log("\n📦 Starting contractor services extended seeding...");

    // Check if contractor services extended already exists
    const existingContractorServicesExtended = await ContractorServicesExtended.findOne();

    if (existingContractorServicesExtended) {
      console.log(
        "⚠️  Contractor services extended data already exists. Clearing existing data...",
      );
      await ContractorServicesExtended.deleteMany({});
    }

    // Insert contractor services extended
    const insertedContractorServicesExtended =
      await ContractorServicesExtended.insertMany(serviceExtendedData);

    console.log("✅ Contractor services extended seeded successfully!");
    console.log(`📊 Total extended services: ${insertedContractorServicesExtended.length}`);
    console.log("\n📋 Extended services added:");
    insertedContractorServicesExtended.forEach((service) => {
      console.log(
        `  - ${service.name} | Material: ${service.materialUnit} | Labor: ${service.laborUnit} | Comment: ${service.comment || "N/A"}`,
      );
    });

    return { contractorServices, contractorServicesExtended: insertedContractorServicesExtended };
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
