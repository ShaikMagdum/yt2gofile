/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#FF0000',
          dark: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          accent: '#3B82F6',
          gofile: '#10B981'
        }
      }
    },
  },
  plugins: [],
}
