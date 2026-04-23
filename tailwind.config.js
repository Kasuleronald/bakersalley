/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        harvest: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        bakery: {
          50: '#faf7f2',
          100: '#f3ece1',
          200: '#e8dbca',
          300: '#d5bfa5',
          400: '#bc9d7e',
          500: '#a78261',
          600: '#946e54',
          700: '#7b5946',
          800: '#654a3d',
          900: '#533f35',
          950: '#2c1f1a',
        },
      }
    },
  },
  plugins: [],
}
