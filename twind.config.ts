import { Options } from "$fresh/plugins/twind.ts";
import { apply } from "twind";
import * as colors from "twind/colors";

export default {
  selfURL: import.meta.url,
  preflight: {
    a: apply`text-indigo text-underline visited:text-violet hover:text-blue`,
  },
  theme: {
    colors: {
      blue: "rgb(0,190,211)",
      indigo: "rgb(0,153,212)",
      violet: "rgb(108, 73, 136)",
      grey: "rgb(215, 215, 215)",
      dark: "rgb(15,15,15)",
      white: colors.white,
      black: colors.black,
    },
  },
} as Options;
