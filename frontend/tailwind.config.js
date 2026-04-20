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
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jost: ['"Jost"', "sans-serif"],
        noto: ['"Noto Sans"', "sans-serif"],
      },
      colors: {
        brand: "#1C5C4B",
        accent: "#E1C563",
        dark: "#020202",
        muted: "#6D6D6D",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1C5C4B",
          light: "#2A7862",
          dark: "#164A3C",
        },
        secondary: {
          DEFAULT: "#E1C563",
          light: "#E9D385",
          dark: "#B89B3F",
        },
      },
    },
  },
  plugins: [],
});
