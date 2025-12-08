/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Vibrant red - main brand
          600: '#e11d48', // Deep red
          700: '#be123c', // Dark red
          800: '#9f1239', // Very dark red
          900: '#881337', // Almost black red
          950: '#4c0519',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green
          600: '#16a34a', // Deep green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Premium gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Additional premium colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // Main dark
          950: '#020617', // Deepest dark
        },
        // Electric blue for highlights
        electric: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      backgroundImage: {
        'sport-gradient': 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)',
        'sport-gradient-light': 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
        'sport-gradient-premium': 'linear-gradient(135deg, #f43f5e 0%, #e11d48 25%, #22c55e 50%, #f59e0b 75%, #3b82f6 100%)',
        'field-pattern': 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(244, 63, 94, 0.1) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(34, 197, 94, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(59, 130, 246, 0.1) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}

