/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary — Terracotta
        primary: {
          DEFAULT: "#C0694A",
          light: "#D4845F",
          dark: "#A0573C",
        },
        // Success — Sage Green
        success: {
          DEFAULT: "#6B9E7A",
          light: "#85B894",
          dark: "#557F62",
        },
        // Error
        error: {
          DEFAULT: "#C0392B",
          light: "#E74C3C",
        },
        // Warning
        warning: {
          DEFAULT: "#D4A017",
          light: "#F1C40F",
        },
        // Info
        info: {
          DEFAULT: "#2980B9",
          light: "#3498DB",
        },
        // Surfaces
        surface: {
          DEFAULT: "#1C1C1E",
          elevated: "#2C2C2E",
          card: "#2C2C2E",
        },
        // Background
        background: {
          DEFAULT: "#121214",
        },
        // Text
        foreground: {
          DEFAULT: "#F5F5F0",
          muted: "#A0A09A",
          subtle: "#6E6E68",
        },
        // Border
        border: {
          DEFAULT: "#3A3A3C",
          muted: "#2C2C2E",
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
