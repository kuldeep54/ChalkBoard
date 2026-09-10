/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        chalk: {
          ink: "#0F1111",
          slate: "#565959",
          tertiary: "#767676",
          mist: "#EAEDED",
          line: "#D5D9D9",
          navline: "#3A4553",
          blue: "#2563eb",
          indigo: "#232F3E",
          accent: "#F0C14B",
          green: "#16A34A",
          red: "#CC0C39",
          white: "#ffffff",
          navy: "#131921",
          navy2: "#37475A",
          gold: "#F0C14B",
          goldtop: "#F7DFA5",
          golddark: "#E7A33E",
          goldedge: "#A88734",
          star: "#FFA41C",
          price: "#B12704",
          orange: "#FF9900",
          page: "#EAEDED",
        },
      },
    },
  },
  plugins: [],
};