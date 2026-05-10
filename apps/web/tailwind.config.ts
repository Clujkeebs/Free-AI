import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00FF9D",
          pink: "#FF00E5",
          cyan: "#00E5FF",
          ink: "#080A12"
        }
      }
    }
  },
  plugins: []
};

export default config;
