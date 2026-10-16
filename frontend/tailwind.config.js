const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: v('ink'),       // text / deep navy
        paper: v('paper'),   // page background
        card: v('card'),     // card surface
        lilac: v('lilac'),   // soft purple block
        brand: { DEFAULT: '#5B54D6', dark: '#4640B5', soft: '#8C86F0' },
        lime: '#DDF247',
        mint: '#7EE2B8',
        sun: '#FFC93C',
        coral: '#FF7A6B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: { soft: '0 10px 30px -12px rgb(27 24 72 / 0.22)', pop: '6px 6px 0 0 rgb(27 24 72)' },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        jump: { '0%,100%': { transform: 'translateY(0) rotate(0)' }, '30%': { transform: 'translateY(-18px) rotate(-4deg)' }, '60%': { transform: 'translateY(-6px) rotate(4deg)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-3px)' }, '75%': { transform: 'translateX(3px)' } },
        spin_slow: { to: { transform: 'rotate(360deg)' } },
        marquee: { to: { transform: 'translateX(-50%)' } },
        pop_in: { from: { opacity: 0, transform: 'translateY(10px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        twinkle: { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.55, transform: 'scale(0.8)' } },
      },
      animation: {
        bob: 'bob 3.2s ease-in-out infinite',
        jump: 'jump 1s ease-in-out infinite',
        shake: 'shake .6s ease-in-out infinite',
        spin_slow: 'spin_slow 18s linear infinite',
        marquee: 'marquee 28s linear infinite',
        pop_in: 'pop_in .35s ease-out both',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
