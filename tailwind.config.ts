import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  target: {
    safari: "14",
  },
  theme: {
    extend: {
      fontFamily: {
        "work-sans": ['"Work Sans"', "sans-serif"],
      },
      colors: {
        "gradient-start": "#7200B4",
        "gradient-end": "#FF00E9",
        // Add other custom colors as needed
      },
    },
  },
  plugins: [],
} satisfies Config;
