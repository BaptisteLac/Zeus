/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Système Émotionnel (v2.0)
        accent: {
          DEFAULT: "#C47A3D", // Focus - état actif, saisie
        },
        emotional: {
          DEFAULT: "#E05D36", // Validation - série cochée, exercice terminé
        },
        achievement: {
          DEFAULT: "#FF8C42", // Achievement - PR, record personnel
        },

        // Rétro-compatibilité le temps de la migration totale
        primary: {
          DEFAULT: "#E05D36", // mapped to emotional for now
          light: "#FF8C42",
          dark: "#C47A3D",
        },
        success: {
          DEFAULT: "#6B9E7A",
          light: "#85B894",
          dark: "#557F62",
        },
        secondary: {
          DEFAULT: "#D4A017",
          light: "#F1C40F",
          dark: "#B8891A",
        },
        error: {
          DEFAULT: "#C0392B",
          light: "#E74C3C",
        },
        warning: {
          DEFAULT: "#D4A017",
          light: "#F1C40F",
        },
        info: {
          DEFAULT: "#2980B9",
          light: "#3498DB",
        },

        // Surfaces (v2.0)
        surface: {
          DEFAULT: "#1E2128",
          elevated: "#2A2E37",
          card: "#1E2128",
        },
        // Background (v2.0)
        background: {
          DEFAULT: "#111318",
        },
        // Text (v2.0)
        foreground: {
          DEFAULT: "#F5F5F7",
          muted: "#8B92A5",
          subtle: "#555B6A",
        },
        // Border (v2.0)
        border: {
          DEFAULT: "#2A2E37",
        },
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        action: "9999px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
