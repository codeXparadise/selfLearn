/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          red: '#FF0000',
          darkRed: '#CC0000',
          hoverRed: '#E60000',
        }
      }
    },
  },
  plugins: [],
}

