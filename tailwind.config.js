/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryRed: "#f94a5a",
        primaryDark: "#374151",
        secondaryRed: "#d62839",
      },
    },
  },
  plugins: [forms],
};
