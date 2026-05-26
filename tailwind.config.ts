import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        muted: "#64748b",
        line: "#d8dee8",
        paper: "#f7f8fb",
        civic: "#1f6f78",
        official: "#24515a"
      },
      boxShadow: {
        soft: "0 6px 20px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
