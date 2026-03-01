/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brown: {
          50:  '#EFEBE9',
          100: '#D7CCC8',
          200: '#BCAAA4',
          300: '#A1887F',
          400: '#8D6E63',
          500: '#795548',
          600: '#6D4C41',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
          950: '#2C1810',
        },
        gold: {
          DEFAULT: '#C8A96E',
          light:   '#E8D5A3',
          dark:    '#A8893E',
        },
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'blob':       'blob 12s ease-in-out infinite alternate',
      },
      keyframes: {
        float:    { '0%,100%': { transform: 'translateY(0px)' },               '50%': { transform: 'translateY(-10px)' } },
        pulseDot: { '0%,100%': { boxShadow: '0 0 0 0 rgba(200,169,110,0.6)' }, '50%': { boxShadow: '0 0 0 6px rgba(200,169,110,0)' } },
        blob:     { 'from':    { transform: 'translate(0,0) scale(1)' },        'to':  { transform: 'translate(30px,-30px) scale(1.06)' } },
      },
    },
  },
  plugins: [],
};