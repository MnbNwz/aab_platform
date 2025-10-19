import Stripe from "stripe";
import { ENV_CONFIG } from "@config/env";

export const stripe = new Stripe(ENV_CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 80000,
  telemetry: false,
});

export const webhookSecret = ENV_CONFIG.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn("⚠️  STRIPE_WEBHOOK_SECRET is not defined - webhooks will not work");
}

console.log("✅ Stripe initialized successfully");
