import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        revo: {
          bg: '#0A0F1F',
          surface: '#0F1729',
          ink: '#E5E9F2',
          accent: '#1F3C88',
          accent2: '#3B82F6',
          gold: '#D4A24C',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
