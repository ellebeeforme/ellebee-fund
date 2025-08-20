/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: { 50:'#fff0f5', 100:'#ffe4ef', 200:'#ffcfe0', 300:'#ffa7c6', 400:'#ff7aa8', 500:'#ff4d8a', 600:'#e23b78', 700:'#b72d5f', 800:'#8d244b', 900:'#6e1c3b' }
      }
    }
  },
  plugins: [],
}
