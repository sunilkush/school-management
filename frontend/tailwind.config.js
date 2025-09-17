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
    
    extend: {
      fontFamily: {
        jost: ['"Jost"', 'sans-serif'],
        noto: ['"Noto Sans"', 'sans-serif'],
      },
       colors: {
        primary: {
          DEFAULT: "#4F46E5", // Indigo
          light: "#6366F1",
          dark: "#4338CA",
        },
        secondary: {
          DEFAULT: "#10B981", // Emerald
          light: "#34D399",
          dark: "#059669",
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
          DEFAULT: "#F59E0B", // Amber
          light: "#FBBF24",
          dark: "#D97706",
        },
      },
    },
  },
  plugins: [],
});