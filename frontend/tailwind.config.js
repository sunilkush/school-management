/** @type {import('tailwindcss').Config} */
import withMT from "@material-tailwind/react/utils/withMT";

import flowbitePlugin from 'flowbite/plugin';
export default withMT({
  darkMode: "class",
  content: [
        "./index.html",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/primereact/**/*.{js,ts,jsx,tsx}",
        "./node_modules/flowbite-react/**/*.js",
        "./node_modules/flowbite/**/*.js",
        // Or if using `src` directory:
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        ".flowbite-react/class-list.json"
      ],
  theme: {
    extend: {
      fontFamily: {
        jost: ['"Jost"', 'sans-serif'],
      },
    },
  },
  plugins: [flowbitePlugin],
});
