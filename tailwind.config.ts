import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],

  theme: {
    screens: {
      "sm": "568px",
      "md": "768px",
      "lg": "768px",
      "xl": "1024px",
      "2xl": "1440px",
    },
    extend: {
      fontFamily: {
        "work-sans": ['"Work Sans"', "sans-serif"],
        "courier-prime": ['"Courier Prime"', "sans-serif"],
        "micro-5": ['"Micro 5"', "sans-serif"],
      },
    },
  },
  target: {
    safari: "14",
  },
  plugins: [],
} satisfies Config;
