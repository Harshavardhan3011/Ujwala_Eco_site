import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#f2f8f5',
          100: '#e1f0e8',
          200: '#c3e1d2',
          300: '#97caaf',
          400: '#64ac88',
          500: '#40916c',
          600: '#2d6a4f',
          700: '#23533e',
          800: '#1b4332',
          900: '#143628',
          950: '#0a1d15',
        },
        jute: {
          50: '#fbf7f2',
          100: '#f5efe3',
          200: '#ebdcbf',
          300: '#dec494',
          400: '#d4a373',
          500: '#c68b59',
          600: '#b07d4f',
          700: '#8c5e3d',
          800: '#714c35',
          900: '#5c3e2e',
        },
        canvas: {
          50: '#fcfbfa',
          100: '#f8f6f0',
          200: '#f3efe6',
          300: '#eae5d9',
          400: '#dcd5c4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      boxShadow: {
        'eco': '0 4px 20px -2px rgba(27, 67, 50, 0.08)',
        'eco-lg': '0 10px 30px -5px rgba(27, 67, 50, 0.12)',
      }
    },
  },
  plugins: [],
};
export default config;
