/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bis: {
          50: '#f0f7fc',
          100: '#e0eff9',
          200: '#b9dff3',
          300: '#7dc4ea',
          400: '#39a6dd',
          500: '#1389c5',
          600: '#0b6ca6',
          700: '#0f4c81',
          800: '#0b3b60',
          900: '#0a3250',
          950: '#061e33',
        },
        gov: {
          saffron: '#FF9933',
          navy: '#000080',
          green: '#138808',
          gold: '#C59B27',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(11, 59, 96, 0.06), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 20px -2px rgba(11, 59, 96, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(11, 59, 96, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
