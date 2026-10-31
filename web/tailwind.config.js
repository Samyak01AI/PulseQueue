/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080B12",
        secondary: "#101522",
        panel: "#151C2A",
        cyan: {
          DEFAULT: "#35D6E8",
          glow: "rgba(53, 214, 232, 0.4)",
        },
        violet: {
          DEFAULT: "#8B7CFF",
          glow: "rgba(139, 124, 255, 0.4)",
        },
        success: "#39D98A",
        warning: "#FFB454",
        danger: "#FF667A",
        textPrimary: "#F5F7FF",
        textMuted: "#929BAD",
      },
      fontFamily: {
        mono: ['Consolas', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'cyan-glow': '0 0 25px rgba(53, 214, 232, 0.25)',
        'violet-glow': '0 0 25px rgba(139, 124, 255, 0.25)',
      }
    },
  },
  plugins: [],
}

