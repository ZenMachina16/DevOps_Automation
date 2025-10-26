/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4f46e5',
          foreground: '#ffffff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        dark: {
          bg: '#0B0C10',
          surface: '#1F2833',
          text: '#C5C6C7',
          accent: '#66FCF1',
          primary: '#45A29E'
        }
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      animation: {
        fadeIn: 'fadeIn 400ms ease-in-out',
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #66FCF1' },
          '50%': { boxShadow: '0 0 20px #45A29E' }
        }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
