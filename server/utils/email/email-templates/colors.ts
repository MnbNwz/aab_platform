export const emailColors = {
  // AAS Brand Colors
  primary: {
    50: "#f8fafb",
    100: "#f1f5f7",
    200: "#e2ebef",
    300: "#c7d6de",
    400: "#a5b8c6",
    500: "#849ab1",
    600: "#687d94",
    700: "#1C425C", // Cards Color
    800: "#002842", // Other components background
    900: "#06324F", // Nav color
    950: "#041f33",
  },
  accent: {
    50: "#fef6f3",
    100: "#fdede6",
    200: "#fad8cc",
    300: "#f6bba8",
    400: "#f09274",
    500: "#E45A35", // Icons background & Text color
    600: "#d2472a",
    700: "#b03822",
    800: "#92311f",
    900: "#772c1f",
    950: "#40140f",
  },
  // Email-specific color mappings
  background: "#f8fafb", // primary.50
  cardBackground: "#1C425C", // primary.700
  headerBackground: "#002842", // primary.800
  textPrimary: "#041f33", // primary.950
  textSecondary: "#687d94", // primary.600
  textLight: "#849ab1", // primary.500
  accentPrimary: "#E45A35", // accent.500
  accentLight: "#f09274", // accent.400
  borderColor: "#e2ebef", // primary.200
  successColor: "#10b981",
  warningColor: "#f59e0b",
  errorColor: "#ef4444",
} as const;

export type EmailColor = keyof typeof emailColors;
