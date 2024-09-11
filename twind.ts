import { Configuration } from "twind";
import { virtualSheet } from "twind/sheets";

export const sheet = virtualSheet();

export const twindConfig: Configuration = {
  sheet,
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
      },
    },
  },
  preflight: {
    // Add any global styles here
  },
  plugins: {
    // Add any custom plugins here
  },
};

console.log("Twind config loaded");
