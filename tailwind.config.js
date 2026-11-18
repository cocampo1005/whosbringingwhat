/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

// Static design tokens (no CSS variables, no dark mode).
const cat = (bold, bar, pastel, tint, accent) => ({ bold, bar, pastel, tint, accent });

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens
        ground: "#F9F6EF",
        raised: "#FFFFFF",
        surface2: "#F5EFE7",
        surface3: "#ECE6DC",
        ink: "#161616",
        muted: "#656462",
        line: "rgba(22,22,22,0.07)",
        lineStrong: "rgba(22,22,22,0.14)",
        control: "#857F79",
        accent: { DEFAULT: "#FF4C43", hover: "#E0433B", soft: "#FFE9E6" },
        selected: { DEFAULT: "#A968FC", soft: "#F1E9FE", text: "#7B3FD4" },
        sidebar: "#FFC952",
        danger: "#C2382E",
        success: "#1F8A5B",
        warning: "#A86E18",
        scrim: "rgba(22,22,22,0.38)",
        cat: {
          main: cat("#FF4C43", "#FF7069", "#FF9B91", "#FFE9E6", "#C2382E"),
          side: cat("#42D072", "#68D98E", "#8FE2AC", "#E6F8EE", "#197C42"),
          dessert: cat("#F8CA49", "#F9D56D", "#FFE194", "#FEF6E2", "#8F6910"),
          beverage: cat("#A968FC", "#BA86FD", "#C9A7F5", "#F1E9FE", "#7B3FD4"),
          misc: cat("#FF73BD", "#FF8FCA", "#FEABD7", "#FFEAF5", "#BD377F"),
        },
      },
      fontFamily: {
        display: ["Archivo Variable", "Archivo", "system-ui", "sans-serif"],
        sans: ["Open Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.5rem",
        dialog: "1.75rem",
        panel: "1.125rem",
        band: "2.25rem",
      },
      boxShadow: {
        soft: "0 2px 14px rgba(22,22,22,.07)",
        chip: "0 2px 8px rgba(22,22,22,.13)",
        raised: "0 10px 30px rgba(22,22,22,.16), 0 0 0 1px rgba(22,22,22,.05)",
        dialog: "0 16px 40px rgba(22,22,22,.18)",
        drawer: "-20px 0 60px rgba(22,22,22,.2)",
        sheet: "0 -10px 40px rgba(0,0,0,.18)",
        action: "0 6px 18px rgba(255,76,67,.28)",
      },
      transitionTimingFunction: {
        wbw: "cubic-bezier(0.2,0,0,1)",
      },
    },
  },
  plugins: [forms],
};
