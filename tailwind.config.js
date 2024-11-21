/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryRed: "#f94a5a",
        primaryDark: "#374151",
        secondaryRed: "#fb6067",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
