/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#BFFF00",
        dark: { bg: "#0A0A0F", card: "#12121A", border: "#1E1E2E" },
        loss: "#FF4060",
        accent: "#00D4FF",
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
