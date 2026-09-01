/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'barbie-pink': '#E0218A',
        'barbie-deep': '#C2185B',
        'barbie-light': '#FCE7F3',
        'barbie-soft': '#FDF2F8',
        'barbie-cyan': '#22D3EE',
      },
    },
  },
  plugins: [],
}