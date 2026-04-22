/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Nunito Sans', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgba(30, 41, 59, 0.35)'
      }
    }
  },
  plugins: []
};
