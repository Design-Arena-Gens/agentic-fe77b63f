import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ember: {
          50: "#fdf6e6",
          100: "#f8e1bc",
          200: "#f3cd95",
          300: "#eeb76b",
          400: "#e7a047",
          500: "#cf7f26",
          600: "#a9631d",
          700: "#834a17",
          800: "#593311",
          900: "#321d0a",
        },
      },
      boxShadow: {
        aureate: "0 40px 120px rgba(252, 209, 145, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
