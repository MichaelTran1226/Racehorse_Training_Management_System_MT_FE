/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2F8F5',
          100: '#E1EFE9',
          200: '#C2DFD4',
          300: '#94C7B5',
          400: '#5EA78E',
          500: '#2D8067',
          600: '#206551',
          700: '#1B5242',
          800: '#1B4332', // Primary EquiFlow Forest Green
          900: '#153629',
          950: '#0B1E16',
        },
        gold: {
          500: '#D4AF37',
          600: '#AA8820',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
