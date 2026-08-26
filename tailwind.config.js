/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        razor: {
          bg: '#0B0E1F',
          surface: '#121633',
          card: '#161B3D',
          border: '#232858',
          muted: '#5B6494',
          text: '#E6E9F7',
        },
        gold: {
          50: '#FFF9E6',
          100: '#FFF0BF',
          200: '#FFE08F',
          300: '#FFD15C',
          400: '#F5C44C',
          500: '#E6B23A',
          600: '#C9962B',
          700: '#9C7320',
        },
        risk: {
          safe: '#22C55E',
          warn: '#F59E0B',
          high: '#EF4444',
          crit: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(245,196,76,0.25)',
        card: '0 8px 32px rgba(0,0,0,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 rgba(239,68,68,0)' },
          '50%': { boxShadow: '0 0 24px rgba(239,68,68,0.55)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
