import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      colors: {
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
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [forms],
};
