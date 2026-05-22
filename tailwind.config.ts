import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#F5C842',
          500: '#D4A017',
          600: '#B8860B',
        },
      },
    },
  },
  plugins: [],
}

export default config
