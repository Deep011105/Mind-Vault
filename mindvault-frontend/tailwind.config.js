/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF9F6',
          dim: '#F1EFE9',
        },
        ink: {
          DEFAULT: '#1C2321',
          soft: '#4A524F',
          faint: '#8A8F8C',
        },
        night: {
          DEFAULT: '#14171A',
          raised: '#1C2024',
          line: '#2A2F34',
        },
        mist: {
          DEFAULT: '#E8E6E1',
          soft: '#B7BAB7',
        },
        moss: {
          50: '#EEF3EC',
          200: '#C4D5C1',
          400: '#7FA37A',
          500: '#5F8B5A',
          600: '#4A7146',
          900: '#233421',
        },
        amber: {
          400: '#D8A24C',
          500: '#C08A34',
        },
        rust: {
          400: '#C06B4F',
          500: '#A8543A',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,35,33,0.04), 0 8px 24px -8px rgba(28,35,33,0.10)',
        'soft-dark': '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'rise': 'rise 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'ink-in': 'inkIn 0.35s ease-out',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        inkIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%':       { transform: 'translateX(-7px)' },
          '30%':       { transform: 'translateX(7px)' },
          '45%':       { transform: 'translateX(-5px)' },
          '60%':       { transform: 'translateX(5px)' },
          '75%':       { transform: 'translateX(-3px)' },
          '90%':       { transform: 'translateX(3px)' },
        },
      },
    },
  },
  plugins: [],
}
