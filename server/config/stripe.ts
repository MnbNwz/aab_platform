import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 80000,
  telemetry: false,
});

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn("⚠️  STRIPE_WEBHOOK_SECRET is not defined - webhooks will not work");
}

console.log("✅ Stripe initialized successfully");
