/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        chalk: {
          ink: "#0f172a",
          slate: "#64748b",
          mist: "#f1f5f9",
          line: "#e2e8f0",
          blue: "#2563eb",
          indigo: "#4f46e5",
          accent: "#f59e0b",
          green: "#059669",
          red: "#dc2626",
          white: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};