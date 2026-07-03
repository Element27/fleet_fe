/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D6E6E',
          dark: '#0A5555',
          light: '#E6F4F4',
        },
        surface: '#F7F6F3',
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        status: {
          green: '#16A34A',
          greenBg: '#DCFCE7',
          amber: '#D97706',
          amberBg: '#FEF3C7',
          red: '#DC2626',
          redBg: '#FEE2E2',
          blue: '#2563EB',
          blueBg: '#DBEAFE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
