import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        white: { value: "var(--text-color)" },
        black: { value: "var(--button-text)" },
        whiteAlpha: {
          50: { value: "var(--surface-bg)" },
          100: { value: "var(--ghost-hover-bg)" },
          200: { value: "var(--card-border)" },
          300: { value: "var(--card-border)" },
          800: { value: "var(--text-muted)" },
        },
        gray: {
          300: { value: "var(--input-border)" },
          400: { value: "var(--input-placeholder)" },
          500: { value: "var(--text-subtle)" },
          600: { value: "var(--card-border)" },
          800: { value: "var(--surface-muted)" },
        },
        brand: {
          50: { value: "var(--bg-color)" },
          100: { value: "var(--bg-color)" },
          500: { value: "#000000" },
          600: { value: "#000000" },
          900: { value: "#000000" },
        },
        accent: {
          500: { value: "#000000" },
          700: { value: "#000000" },
        },
        danger: {
          500: { value: "#000000" },
          700: { value: "#000000" },
        },
        red: {
          400: { value: "#000000" },
          500: { value: "#000000" },
          600: { value: "#000000" },
          900: { value: "#000000" },
        },
        green: {
          400: { value: "#000000" },
          500: { value: "#000000" },
        },
        yellow: {
          400: { value: "#000000" },
          500: { value: "#000000" },
        },
        surface: {
          50: { value: "var(--surface-bg)" },
          100: { value: "var(--surface-muted)" },
          700: { value: "var(--surface-muted)" },
          800: { value: "var(--surface-elevated)" },
          900: { value: "var(--bg-color)" },
        },
        muted: {
          300: { value: "var(--text-muted)" },
          500: { value: "var(--text-subtle)" },
        },
      },
      radii: {
        control: { value: "12px" },
        panel: { value: "8px" },
      },
      spacing: {
        touch: { value: "44px" },
      },
    },
  },
  globalCss: {
    body: {
      bg: "var(--bg-color)",
      color: "var(--text-color)",
    },
  },
});
