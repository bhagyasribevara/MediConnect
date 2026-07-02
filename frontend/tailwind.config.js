/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        secondary: "#00BFA6",
        accent: "#EBF8F6",
        dark: "#1E293B",
        clay: "#F0F4F8"
      },
      boxShadow: {
        'clay': 'inset 4px 4px 10px #d1d9e6, inset -4px -4px 10px #ffffff, 8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        'clay-hover': 'inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      }
    },
  },
  plugins: [],
}
