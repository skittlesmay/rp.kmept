import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Background colors
        dark: {
          DEFAULT: "#050505",
          50: "#0a0a0a",
          100: "#111111",
          200: "#1a1a1a",
          300: "#222222",
        },
        // Neon accent colors
        neon: {
          cyan: "#00f0ff",
          green: "#00ff88",
          pink: "#ff3366",
          purple: "#b366ff",
        },
        // Glass colors
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          light: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.1)",
        },
        // Text colors
        text: {
          primary: "#ffffff",
          secondary: "rgba(255, 255, 255, 0.6)",
          muted: "rgba(255, 255, 255, 0.4)",
        },
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
      },
      borderRadius: {
        "pill": "100px",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0, 240, 255, 0.5)",
        "neon-cyan-lg": "0 0 40px rgba(0, 240, 255, 0.6)",
        "neon-green": "0 0 20px rgba(0, 255, 136, 0.5)",
        "neon-pink": "0 0 20px rgba(255, 51, 102, 0.5)",
        "neon-purple": "0 0 20px rgba(179, 102, 255, 0.5)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in-down": "fadeInDown 0.6s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.5)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 240, 255, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
