/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  // NativeWind v4 dark mode – useColorScheme() ile kontrol edilir
  darkMode: 'class',
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
        // Koyu mod yüzey renkleri
        'dark-bg':      '#0f172a',
        'dark-surface': '#1e293b',
        'dark-card':    '#1e293b',
        'dark-border':  '#334155',
        'dark-muted':   '#94a3b8',
      },
      borderRadius: {
        '4xl': 32,
        '5xl': 40,
      },
    },
  },
  plugins: [],
};