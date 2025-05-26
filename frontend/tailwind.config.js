/** @type {import('tailwindcss').Config} */
import withMT from "@material-tailwind/react/utils/withMT";
import flowbiteReact from "flowbite-react/plugin/tailwindcss";

export default withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    ".flowbite-react/class-list.json"
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbiteReact],
});