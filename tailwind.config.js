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
      },
      borderRadius: {
        '4xl': 32,
        '5xl': 40,
      },
    },
  },
  plugins: [],
};