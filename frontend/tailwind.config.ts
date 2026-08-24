import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        devflow: {
          background: '#0F172A',
          surface: '#1E293B',
          text: '#F1F5F9',
          muted: '#94A3B8',
          accent: '#1E90FF',
          success: '#00FF85',
        },
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
