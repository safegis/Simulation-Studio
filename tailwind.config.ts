// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This maps `font-sans` to the Poppins variable
        sans: ["var(--font-poppins)"],
      },
    },
  },
  plugins: [],
};

export default config;
