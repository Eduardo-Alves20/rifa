import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        surface2: "var(--c-surface2)",
        border: "var(--c-border)",
        border2: "var(--c-border2)",
        yellow: {
          DEFAULT: "var(--c-yellow)",
          hover: "var(--c-yellow-hover)",
          dim: "var(--c-yellow-dim)",
          dim2: "var(--c-yellow-dim2)",
        },
        text: {
          DEFAULT: "var(--c-text)",
          2: "var(--c-text2)",
          3: "var(--c-text3)",
        },
        green: { DEFAULT: "var(--c-green)" },
        red: { DEFAULT: "var(--c-red)" },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.3px",
        tighter2: "-0.5px",
      },
    },
  },
  plugins: [],
};

export default config;
