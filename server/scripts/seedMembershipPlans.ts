import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MembershipPlan } from "../models/membershipPlan";
import { connectDB } from "../config/db";

const membershipPlans = [
  {
    name: "Basic Customer Plan",
    description: "Essential features for homeowners",
    userType: "customer",
    tier: "basic",
    features: [
      "Basic property management",
      "5 service requests per month",
      "Standard support",
      "Basic dashboard access"
    ],
    price: 1999, // $19.99 in cents
    duration: 30, // 30 days
  },
  {
    name: "Standard Customer Plan", 
    description: "Enhanced features for active homeowners",
    userType: "customer",
    tier: "standard",
    features: [
      "Advanced property management",
      "15 service requests per month",
      "Priority support",
      "Maintenance scheduling",
      "Advanced analytics"
    ],
    price: 3999, // $39.99 in cents
    duration: 30,
  },
  {
    name: "Premium Customer Plan",
    description: "Complete solution for property owners",
    userType: "customer", 
    tier: "premium",
    features: [
      "Unlimited service requests",
      "24/7 premium support",
      "Advanced maintenance scheduling",
      "Full analytics suite",
      "Priority contractor matching",
      "Emergency services"
    ],
    price: 7999, // $79.99 in cents
    duration: 30,
  },
  {
    name: "Basic Contractor Plan",
    description: "Essential tools for independent contractors",
    userType: "contractor",
    tier: "basic",
    features: [
      "Job management",
      "Basic analytics",
      "Customer communication tools",
      "Payment processing"
    ],
    price: 4999, // $49.99 in cents
    duration: 30,
  },
  {
    name: "Standard Contractor Plan",
    description: "Advanced tools for growing businesses",
    userType: "contractor",
    tier: "standard", 
    features: [
      "Advanced job management",
      "Detailed analytics",
      "Enhanced customer tools",
      "Payment processing",
      "Lead generation",
      "Scheduling tools"
    ],
    price: 9999, // $99.99 in cents
    duration: 30,
  },
  {
    name: "Premium Contractor Plan",
    description: "Complete business solution for contractors",
    userType: "contractor",
    tier: "premium",
    features: [
      "Complete business management",
      "Advanced analytics & reporting",
      "Full customer relationship tools",
      "Priority payment processing",
      "Premium lead generation",
      "Advanced scheduling & routing",
      "24/7 business support"
    ],
    price: 19999, // $199.99 in cents
    duration: 30,
  }
];

export const seedMembershipPlans = async () => {
  try {
    console.log("Starting membership plans seeding...");
    
    // Clear existing plans
    await MembershipPlan.deleteMany({});
    console.log("Cleared existing membership plans");
    
    // Insert new plans
    const createdPlans = await MembershipPlan.insertMany(membershipPlans);
    console.log(`Created ${createdPlans.length} membership plans:`);
    
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name} (${plan.userType} - ${plan.tier}) - $${plan.price/100}`);
    });
    
    return createdPlans;
  } catch (error) {
    console.error("Error seeding membership plans:", error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedMembershipPlans();
      console.log("Membership plans seeded successfully!");
      process.exit(0);
    } catch (error) {
      console.error("Seeding failed:", error);
      process.exit(1);
    }
  })();
}
