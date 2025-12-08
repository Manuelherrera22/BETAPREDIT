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
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#8b94f8',
          500: '#7c7cf2', // Elegant indigo-blue
          600: '#6366f1', // Deep indigo
          700: '#4f46e5', // Rich indigo
          800: '#4338ca', // Dark indigo
          900: '#3730a3', // Very dark indigo
          950: '#1e1b4b', // Deepest indigo
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Elegant sky blue
          600: '#0284c7', // Deep sky blue
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        gold: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#8b5cf6', // Elegant violet
          600: '#7c3aed', // Deep violet
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
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
        // Success green - elegant emerald
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Elegant emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Elegant navy for depth
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        'sport-gradient': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
        'sport-gradient-light': 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)',
        'sport-gradient-premium': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 25%, #0ea5e9 50%, #8b5cf6 75%, #10b981 100%)',
        'elegant-gradient': 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
        'field-pattern': 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0)',
        'mesh-gradient': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(234, 179, 8, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(212, 175, 55, 0.08) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%)',
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

