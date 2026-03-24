/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2b678c',
          dark: '#204f6d',
          light: '#5a8fb1',
        },
        background: {
          light: '#f6f8fb',
          dark: '#1e2739',
        },
        surface: {
          light: '#ffffff',
          dark: '#2a3649',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0px 2px 8px rgba(0, 0, 0, 0.04)',
        card: '0px 4px 12px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
