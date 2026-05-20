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
        primary: {
         DEFAULT: "#1d5fd3", // EduManage blue
          light: "#3c7ff2",
          dark: "#0b2460",
        },
        secondary: {
          DEFAULT: "#0b2460", // Deep navy
          light: "#1d5fd3",
          dark: "#081a46",
        },
        background: {
          DEFAULT: "#F9FAFB", // Gray-50
          dark: "#F3F4F6",
        },
        text: {
          DEFAULT: "#1F2937", // Gray-800
          light: "#374151",
        },
        accent: {
         DEFAULT: "#f4b400", // Gold accent
          light: "#ffcf4d",
          dark: "#cc9200",
        },
      },
    },
  },
  plugins: [],
});