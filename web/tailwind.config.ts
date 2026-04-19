import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF7E0",
        peach: "#FFD6A5",
        apricot: "#FFB584",
        grape: "#6F4AB7",
        plum: "#3D2466",
        ink: "#2A1B3D",
        mint: "#C7F0D2",
        sky: "#B6DFF9",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      animation: {
        spin: "spin 6s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        "vhs-glow": "vhsGlow 2s ease-in-out infinite",
        "tape-wobble": "tapeWobble 4s ease-in-out infinite",
        "fade-up": "fadeUp 0.35s ease both",
        shimmer: "shimmer 1.4s infinite linear",
      },
      keyframes: {
        vhsGlow: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        tapeWobble: {
          "0%,100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      boxShadow: {
        pop: "0 12px 30px -10px rgba(61, 36, 102, 0.35)",
        inner2: "inset 0 2px 6px rgba(61,36,102,0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
