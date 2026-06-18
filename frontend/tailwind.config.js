/** @type {import('tailwindcss').Config} */
import withMT from "@material-tailwind/react/utils/withMT";


export default withMT({
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
        jost: ['"Jost"', 'sans-serif'],
        noto: ['"Noto Sans"', 'sans-serif'],
      },
       colors: {
        /* ── Pastel interactive brand ── */
        primary: {
          DEFAULT: "#5B9EC9",
          hover:   "#4A8DB8",
          light:   "#A7C7E7",
          lighter: "#D4E9F7",
        },
        secondary: {
          DEFAULT: "#9B87B8",
          hover:   "#8A76A7",
          light:   "#CDB4DB",
          lighter: "#EAE0F5",
        },
        /* ── Pastel accent palette ── */
        pastel: {
          blue:    "#A7C7E7",
          purple:  "#CDB4DB",
          pink:    "#FFCAD4",
          mint:    "#B8E0D2",
          yellow:  "#FDE2A7",
        },
        /* ── Surfaces ── */
        background: {
          DEFAULT: "#F7F8FC",
          soft:    "#EFF3FB",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft:    "#EFF3FB",
          page:    "#F7F8FC",
        },
        /* ── Text ── */
        ink: {
          DEFAULT:   "#2E2E2E",
          secondary: "#5A6376",
          muted:     "#8A94A6",
          disabled:  "#B0B8C8",
        },
        /* ── Semantic ── */
        success: {
          DEFAULT: "#5BA89A",
          light:   "#B8E0D2",
        },
        warning: {
          DEFAULT: "#D4922A",
          light:   "#FDE2A7",
        },
        danger: {
          DEFAULT: "#D96B7A",
          light:   "#FFCAD4",
        },
        /* ── Border ── */
        border: {
          DEFAULT: "#E4EAF6",
          muted:   "#EEF2FB",
        },
      },
    },
  },
  plugins: [],
});