/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hot:  { DEFAULT: '#DC2626', light: '#FEE2E2', badge: '#B91C1C' },
        warm: { DEFAULT: '#D97706', light: '#FEF3C7', badge: '#92400E' },
        cold: { DEFAULT: '#2563EB', light: '#DBEAFE', badge: '#1E40AF' },
      }
    }
  },
  plugins: []
}
