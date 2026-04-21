/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'debo-primary': '#1E3A8A',
        'debo-secondary': '#3B82F6',
        'debo-accent': '#F59E0B',
        'debo-dark': '#1F2937',
        'debo-success': '#10B981',
        'debo-danger': '#EF4444',
        'debo-warning': '#F59E0B',
        'debo-info': '#3B82F6',
      }
    },
  },
  plugins: [],
}