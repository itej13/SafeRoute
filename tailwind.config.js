/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#0B0E1A',
          800: '#10152A',
          700: '#161B2E',
          600: '#232A45',
        },
        lamp: {
          400: '#FFB648',
        },
        mist: {
          100: '#EDEFF7',
          400: '#8B93AD',
        },
        safe: '#3EC98E',
        risk: '#E4576B',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
