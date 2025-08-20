/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      boxShadow: { soft: '0 6px 24px rgba(16, 24, 40, 0.04)' },
    },
  },
  plugins: [],
};
