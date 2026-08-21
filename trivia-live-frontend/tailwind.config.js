/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: '#0A0918',
          deep: '#12102A',
          surface: '#1C1A42',
          surface2: '#26234F',
          surface3: '#33306B',
          gold: '#FFC93C',
          pink: '#FF5D8F',
          teal: '#3DDC97',
          coral: '#FF6B57',
          violet: '#8C7CFF',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        popUp: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.8)' },
          '20%': { opacity: '1', transform: 'translateY(-8px) scale(1.05)' },
          '100%': { opacity: '0', transform: 'translateY(-48px) scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 201, 60, 0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 201, 60, 0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        popUp: 'popUp 1.1s ease-out forwards',
        pulseGlow: 'pulseGlow 1.6s infinite',
        slideIn: 'slideIn 0.3s ease-out forwards',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
