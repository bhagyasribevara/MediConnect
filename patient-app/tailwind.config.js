/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        secondary: "#00BFA6",
        accent: "#EBF8F6",
        dark: "#1E293B",
        clay: "#F0F4F8",
      }
    },
  },
  plugins: [],
}
