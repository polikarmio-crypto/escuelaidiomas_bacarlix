/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        military: {
          green: '#1b4332',
          'green-dark': '#132e22',
          'green-light': '#2d6a4f',
          gold: '#b8860b',
          'gold-light': '#c59b27',
          navy: '#1e293b',
        },
        brand: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          muted: '#94a3b8',
          green: '#1b4332',
          'green-hover': '#2d6a4f',
          'green-subtle': '#143527',
          gold: '#b8860b',
          'gold-hover': '#d4a337',
          'gold-subtle': '#8c6b1d',
          navy: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
};
