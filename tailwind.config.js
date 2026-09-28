/** @type {import('tailwindcss').Config} */
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default {
  content: [here('./index.html'), here('./src') + '/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#141922',
        navy: { DEFAULT: '#0A2342', 900: '#071A33', 800: '#0F2E55', 700: '#163B6B' },
        signal: { DEFAULT: '#1B5CFF', 700: '#1447CC', 600: '#1650E8', 100: '#DCE6FF', 50: '#EEF3FF' },
        mist: '#F4F6F9',
        line: '#E3E8EF',
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'system-ui', 'sans-serif'],
        board: ['"Barlow Condensed"', '"Schibsted Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(10,35,66,.06), 0 8px 24px -12px rgba(10,35,66,.18)',
        pop: '0 24px 60px -20px rgba(7,26,51,.45)',
      },
      keyframes: {
        flap: { '0%': { transform: 'rotateX(90deg)', opacity: 0 }, '100%': { transform: 'rotateX(0)', opacity: 1 } },
        slidein: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        rise: { '0%': { transform: 'translateY(12px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
      },
      animation: {
        flap: 'flap .38s cubic-bezier(.2,.8,.2,1) both',
        slidein: 'slidein .28s cubic-bezier(.2,.8,.2,1)',
        rise: 'rise .25s cubic-bezier(.2,.8,.2,1)',
        fade: 'fade .2s ease-out',
      },
    },
  },
  plugins: [],
};
