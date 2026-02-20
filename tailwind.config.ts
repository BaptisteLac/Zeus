import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"], // Support both 'class' and internal defaults
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // "Athletic Stealth" uses Inter for everything
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Legacy font alisases mapped to Inter to prevent breakage
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Muscle Buddy System Tokens
        mb: {
          primary: {
            DEFAULT: "hsl(var(--mb-color-primary-default))",
            hover: "hsl(var(--mb-color-primary-hover))",
            active: "hsl(var(--mb-color-primary-active))",
            disabled: "hsl(var(--mb-color-primary-disabled))",
          },
          success: {
            DEFAULT: "hsl(var(--mb-color-success-default))",
            subtle: "hsla(var(--mb-color-success-subtle), 0.25)",
          },
          warning: "hsl(var(--mb-color-warning-default))",
          error: "hsl(var(--mb-color-error-default))",
          info: "hsl(var(--mb-color-info-default))",
          bg: {
            DEFAULT: "hsl(var(--mb-color-bg-default))",
            elevated: "hsl(var(--mb-color-bg-elevated))",
          },
          surface: {
            DEFAULT: "hsl(var(--mb-color-surface-default))",
            raised: "hsl(var(--mb-color-surface-raised))",
          },
          fg: {
            DEFAULT: "hsl(var(--mb-color-fg-default))",
            muted: "hsl(var(--mb-color-fg-muted))",
            disabled: "hsl(var(--mb-color-fg-disabled))",
          },
        },

        // Shadcn/UI Component Tokens (Mapped to Muscle Buddy)
        primary: {
          DEFAULT: "hsl(var(--mb-color-primary-default))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },
        secondary: {
          DEFAULT: "hsl(var(--mb-color-surface-raised))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },
        destructive: {
          DEFAULT: "hsl(var(--mb-color-error-default))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },
        muted: {
          DEFAULT: "hsl(var(--mb-color-surface-raised))",
          foreground: "hsl(var(--mb-color-fg-muted))",
        },
        accent: {
          DEFAULT: "hsl(var(--mb-color-surface-raised))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },
        popover: {
          DEFAULT: "hsl(var(--mb-color-surface-default))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },
        card: {
          DEFAULT: "hsl(var(--mb-color-surface-default))",
          foreground: "hsl(var(--mb-color-fg-default))",
        },

        // Phantom/Legacy Token Aliases (for backward compatibility)
        brand: "hsl(var(--mb-color-primary-default))",
        sage: "hsl(var(--mb-color-success-default))",
        brick: "hsl(var(--mb-color-error-default))",
        sand: "hsl(var(--mb-color-bg-elevated))",
        terracotta: "hsl(var(--mb-color-primary-default))",
        linen: "hsl(var(--mb-color-bg-default))",
        "warm-white": "hsl(var(--mb-color-fg-default))",
        graphite: "hsl(var(--mb-color-fg-muted))",
        charcoal: "hsl(var(--mb-color-bg-default))",
        stone: "hsl(var(--mb-color-fg-muted))",
        ivory: "hsl(var(--mb-color-fg-default))",
        taupe: "hsl(var(--mb-color-fg-muted))",


      },
      borderRadius: {
        lg: "var(--mb-radius-lg)",
        md: "var(--mb-radius-md)",
        sm: "var(--mb-radius-sm)",
      },
      boxShadow: {
        surface: "var(--mb-shadow-surface)",
        active: "var(--mb-shadow-active)",
        success: "var(--mb-shadow-success)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      spacing: {
        'touch': '48px',
        'touch-primary': '56px',
      },
      minHeight: {
        'touch': '48px',
        'touch-primary': '56px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "success-glow": {
          "0%": { boxShadow: "0 0 0 0 hsla(110, 18%, 54%, 0.4)" },
          "70%": { boxShadow: "0 0 0 8px hsla(110, 18%, 54%, 0)" },
          "100%": { boxShadow: "0 0 0 0 hsla(110, 18%, 54%, 0)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 300ms ease-out forwards",
        "slide-down": "slide-down 300ms ease-out forwards",
        "success-glow": "success-glow 0.8s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
