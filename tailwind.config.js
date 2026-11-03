export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Figtree', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#0B2B40', brand: '#0F5C8E', teal: '#0E9AA7', mist: '#F2F8FA',
        line: '#D9E6EC', amber: { soft: '#FFF4DF', deep: '#8A4B00' },
      },
      boxShadow: { card: '0 1px 2px rgba(11,43,64,.06), 0 4px 14px rgba(11,43,64,.05)' },
    },
  },
  plugins: [],
};
