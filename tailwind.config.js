/** @type {import('tailwindcss').Config} */
module.exports = {
  // .tsx uzantılarını ve klasörlerini tam tanımlıyoruz
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        agora: {
          bg: '#F3F4F6',
          primary: '#1E40AF',
          dark: '#1F2937',
        },
        'primary-blue': '#0A2540',
        'ice-white': '#F8FAFC',
        'accent-blue': '#3B82F6',
        'ink': '#1A1A1A',
      },
      borderRadius: {
        '4xl': 32,
        '5xl': 40,
      },
    },
  },
  plugins: [],
};