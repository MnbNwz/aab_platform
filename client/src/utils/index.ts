// Utility functions for client

// Currency formatting utilities
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  // For values less than 1000, use toFixed(2) to ensure consistent formatting
  // and prevent UI overflow issues with long decimal numbers
  return `$${amount.toFixed(2)}`;
};

// Chart colors configuration
export const CHART_COLORS = {
  primary: "#06324F",
  primaryLight: "#1C425C",
  accent: "#E45A35",
  accentLight: "#f09274",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

// Export role helpers
export * from "./roleHelpers";
