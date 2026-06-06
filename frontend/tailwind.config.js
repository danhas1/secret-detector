/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0A0A0B",
          1: "#111114",
          2: "#18181c",
          3: "#1e1e24",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.12)",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          glow: "rgba(99,102,241,0.25)",
        },
        danger: {
          DEFAULT: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          border: "rgba(239,68,68,0.3)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          bg: "rgba(245,158,11,0.1)",
          border: "rgba(245,158,11,0.3)",
        },
        success: {
          DEFAULT: "#10b981",
          bg: "rgba(16,185,129,0.1)",
          border: "rgba(16,185,129,0.3)",
        },
      },
      animation: {
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "scan-line": "scanLine 1.5s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        scanLine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "glow-radial":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent)",
        "hero-gradient":
          "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(99,102,241,0.12), transparent 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.07), 0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":
          "0 0 0 1px rgba(255,255,255,0.12), 0 8px 40px rgba(0,0,0,0.5)",
        glow: "0 0 40px rgba(99,102,241,0.25)",
        danger: "0 0 20px rgba(239,68,68,0.2)",
      },
    },
  },
  plugins: [],
};
