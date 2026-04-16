import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        garage: {
          50: "var(--g-50)",
          100: "var(--g-100)",
          200: "var(--g-200)",
          300: "var(--g-300)",
          400: "var(--g-400)",
          500: "var(--g-500)",
          600: "var(--g-600)",
          700: "var(--g-700)",
          800: "var(--g-800)",
          900: "var(--g-900)",
          950: "var(--g-950)",
        },
        accent: {
          DEFAULT: "#f97316",
          light: "#fb923c",
          dark: "#ea580c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
