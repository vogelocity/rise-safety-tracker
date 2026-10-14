/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors: injected as CSS variables at app start by src/lib/brand.ts
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        // Fixed, non-brand tokens
        danger: '#B42318',
        success: '#067647',
        muted: '#667085',
      },
      fontFamily: {
        sans: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
