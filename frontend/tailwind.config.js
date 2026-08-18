/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
        "./index.html",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",

        // Or if using `src` directory:
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        
      ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        inter:   ['"Inter"', '"Poppins"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
      },
      colors: {
        /* ── Brand ── */
        primary: {
          DEFAULT: "#2563EB",
          hover:   "#1D4ED8",
          light:   "#DBEAFE",
          lighter: "#EFF6FF",
        },
        secondary: {
          DEFAULT: "#0F172A",
          light:   "#1E293B",
        },
        accent: {
          DEFAULT: "#14B8A6",
          hover:   "#0D9488",
          light:   "#CCFBF1",
        },
        /* ── Surfaces ── */
        background: {
          DEFAULT: "#F8FAFC",
          soft:    "#F1F5F9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft:    "#F1F5F9",
          page:    "#F8FAFC",
        },
        /* ── Text ── */
        ink: {
          DEFAULT:   "#0F172A",
          secondary: "#64748B",
          muted:     "#94A3B8",
          disabled:  "#CBD5E1",
        },
        /* ── Semantic ── */
        success: {
          DEFAULT: "#22C55E",
          hover:   "#15803D",
          light:   "#DCFCE7",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover:   "#B45309",
          light:   "#FEF3C7",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover:   "#DC2626",
          light:   "#FEE2E2",
        },
        info: {
          DEFAULT: "#3B82F6",
          light:   "#DBEAFE",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          hover:   "#6D28D9",
        },
        pink: {
          DEFAULT: "#EC4899",
        },
        /* ── Border ── */
        border: {
          DEFAULT: "#E2E8F0",
          muted:   "#F1F5F9",
        },
        /* ── Slate (utility) ── */
        slate: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};