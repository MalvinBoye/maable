/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        maable: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          xp: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
          bg: '#09090b',
          surface: '#18181b',
          border: '#27272a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      },
      borderRadius: {
        btn: '0.625rem',
        card: '1rem',
      },
    },
  },
  plugins: [],
}
