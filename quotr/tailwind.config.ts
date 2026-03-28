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
        background: "#f5f5f6",
        foreground: "#111112",
        card: "#ffffff",
        border: "#e4e4e7",
        primary: "#111112",
        accent: "#2563eb",
        "status-green": "#16a34a",
        "status-green-bg": "#f0fdf4",
        "status-green-border": "#bbf7d0",
        "status-amber": "#d97706",
        "status-amber-bg": "#fffbeb",
        "status-amber-border": "#fde68a",
        "status-red": "#dc2626",
        "status-red-bg": "#fef2f2",
        "status-red-border": "#fecaca",
        "status-blue": "#2563eb",
        "status-blue-bg": "#eff6ff",
        "status-blue-border": "#bfdbfe",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        card: "6px",
        input: "4px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
      },
      spacing: {
        sidebar: "240px",
      },
    },
  },
  plugins: [],
};
export default config;
