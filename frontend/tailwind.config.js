/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9f4',
          100: '#f6f0e3',
          200: '#eddcc5',
          300: '#dfc29e',
          400: '#cca273',
          500: '#ba8551',
          600: '#ac7344',
          700: '#8f5c36',
          800: '#734a2e',
          900: '#5e3e29',
          950: '#342014',
        }
      }
    },
  },
  plugins: [],
}
