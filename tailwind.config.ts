import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  target: {
    safari: "14",
  },
  plugins: [],
} satisfies Config;
