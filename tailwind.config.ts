import { type Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import type { PluginAPI } from "tailwindcss/types/config";

export default {
  content: [
    "{routes,islands,components,lib}/**/*.{ts,tsx}",
    "./static/**/*.{html,js}",
  ],

  theme: {
    extend: {
      screens: {
        "mobileSm": "360px", // Custom
        // "mobile-568": " // UNUSED - USE mobileSm
        "mobileMd": "568px", // Custom
        "mobileLg": "768px", // Custom
        "tablet": "1024px", // Same as Tailwind's 'lg' (1024px)
        "desktop": "1440px", // Same as Tailwind's 'xl' (1440px)
      },
      fontFamily: {
        sans: ['"Work Sans"', "sans-serif"],
        "work-sans": ['"Work Sans"', "sans-serif"],
        "courier-prime": ['"Courier Prime"', "sans-serif"],
        "micro-5": ['"Micro 5"', "sans-serif"],
      },
      colors: {
        stamp: {
          primary: {
            DEFAULT: "#8800CC",
            light: "#9900EE",
            dark: "#660099",
            hover: "#AA00FF",
          },
          purple: {
            darkest: "#220033",
            darker: "#440066",
            dark: "#660099",
            DEFAULT: "#8800CC",
            bright: "#AA00FF",
            light: "#4F3666",
            accent: "#7A00F5",
            highlight: "#AA00FF",
          },
          grey: {
            darkest: "#333333",
            darker: "#666666",
            DEFAULT: "#999999",
            light: "#CCCCCC",
            bright: "#FFFFFF",
          },
          bg: {
            purple: {
              darkest: "#0A000F",
              darker: "#14001F",
              dark: "#1F002E",
            },
            grey: {
              darkest: "#080808",
              darker: "#0F0F0F",
              dark: "#171717",
            },
          },
          table: {
            text: "#DBDBDB",
            placeholder: "#8D9199",
            header: "#F5F5F5",
            inactive: "#B9B9B9",
          },
          button: {
            text: "#330033",
          },
          dark: {
            DEFAULT: "#0B0B0B",
            lighter: "#181818",
            gradient: "#1F002E",
          },
          text: {
            primary: "#999999",
            secondary: "#666666",
            "custom-stroke-color": "#80C",
          },
          input: {
            bg: "#4F3666",
            border: "#8A8989",
          },
          search: {
            placeholder: "#8D9199",
            background: "#660099",
          },
          scrollbar: {
            track: "#333333",
            thumb: "#660099",
            hover: "#aa00ff",
          },
          overlay: {
            DEFAULT: "rgba(24, 24, 24, 0.5)",
            dark: "rgba(8, 8, 8, 0.75)",
          },
          border: {
            light: "#3F2A4E",
            DEFAULT: "#8A8989",
            hover: "#AA00FF",
          },
        },
      },
      backgroundImage: {
        "stamp-primary":
          "linear-gradient(141deg, rgba(10, 0, 15, 0) 0%, #14001F 50%, #1F002E 100%)",
        "stamp-dark":
          "linear-gradient(to bottom right, #1f002e00, #14001f7f, #1f002eff)",
        "purple-bg-gradient":
          "linear-gradient(to right, #8800cc, #7700aa, #660099)",
        "text-purple-1": "linear-gradient(to right, #440066, #660099, #8800cc)",
        "text-purple-2":
          "linear-gradient(to right, #440066, #660099, #8800cc, #aa00ff)",
        "text-purple-3": "linear-gradient(to right, #8800cc, #660099, #440066)",
        "text-purple-4":
          "linear-gradient(to right, #aa00ff, #8800cc, #660099, #440066)",
        "text-gray-1": "linear-gradient(to right, #cccccc, #999999, #666666)",
        "text-gray-2": "linear-gradient(to right, #999999, #666666)",
        "text-gray-3": "linear-gradient(to right, #666666, #999999, #cccccc)",
        "text-gray-4": "linear-gradient(to right, #666666, #999999)",
        "text-purple-hover-default":
          "linear-gradient(90deg, #440066 0%, #660099 50%, #8800cc 75%, #aa00ff 100%)",
        "text-purple-hover-active":
          "linear-gradient(90deg, #440066 0%, #660099 25%, #8800cc 50%, #aa00ff 75%)",
        "stamp-number":
          "linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))",
        "stamp-hover": "linear-gradient(to right, var(--tw-gradient-stops))",
        "stamp-bg-dark":
          "linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))",
        "stamp-text-grey": "linear-gradient(to right, #666666, #999999)",
        "stamp-text-purple":
          "linear-gradient(to right, #440066, #660099, #8800cc)",
        "stamp-card-bg":
          "linear-gradient(141deg, rgba(10, 0, 15, 0) 0%, #14001F 50%, #1F002E 100%)",
        "slide-content":
          "linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75))",
        "gradient-top": "var(--gradient-top)",
        "gradient-filters":
          "linear-gradient(to bottom, #080808 100%, #080808 80%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      spacing: {
        "stamp-card": "6px",
        "stamp-card-lg": "max(6px,min(12px,calc(6px+((100vw-360px)*0.029))))",
        "search-icon": "12px",
        "stroke-width": "2px",
        "gutter-mobile": "12px", // 12px
        "gutter-desktop": "24px", // 24px
        "margin-mobile": "18px", // 18px
        "margin-tablet": "36px", // 36px
        "margin-desktop": "72px", // 72px
        "padding-mobile": "12px", // 12px
        "padding-tablet": "24px", // 24px
        "padding-desktop": "48px", // 48px
        "calc-24": "calc(100% - 24px)",
        "calc-12": "calc(100% - 12px)",
      },
      borderRadius: {
        "stamp": "6px",
      },
      boxShadow: {
        "stamp": "0px 0px 30px #aa00ff",
        "stamp-hover": "0px 0px 40px #aa00ff",
        "collection": "0px 0px 30px #FFFFFF7F",
      },
      aspectRatio: {
        "stamp": "1",
      },
      zIndex: {
        "modal": "50",
        "tooltip": "40",
        "dropdown": "30",
      },
      maxWidth: {
        "desktop": "1920px",
        "none": "none",
      },
      lineClamp: {
        2: "2",
      },
      height: {
        "gradient-top": "max(140vh, 1400px)",
        "gradient-bottom": "max(100vh, 700px)",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }: PluginAPI) {
      addUtilities({
        ".optimize-text": {
          "will-change": "transform",
          "transform": "translateZ(0)",
          "backface-visibility": "hidden",
        },
        ".text-stroke-glow": {
          "text-shadow": `
            /* Glow effect */
            -0.05em -0.05em 0.25em #A0F,    /* top-left */
            0.05em -0.05em 0.25em #A0F,     /* top-right */
            0.05em 0.05em 0.25em #A0F,      /* bottom-right */
            -0.05em 0.05em 0.25em #A0F,     /* bottom-left */
            -0.05em 0 0.25em #A0F,         /* left */
            0.05em 0 0.25em #A0F,          /* right */
            0 -0.05em 0.25em #A0F,         /* top */
            0 0.05em 0.25em #A0F,          /* bottom */
            
            /* Stroke effect */
            -3px -3px 0 #A0F,
            3px -3px 0 #A0F,
            -3px 3px 0 #A0F,
            3px 3px 0 #A0F,
            -3px 0 0 #A0F,
            3px 0 0 #A0F,
            0 -3px 0 #A0F,
            0 3px 0 #A0F
          `,
        },
        ".bg-clip-text": {
          "-webkit-background-clip": "text",
          "background-clip": "text",
        },
        ".text-fill-transparent": {
          "-webkit-text-fill-color": "transparent",
          "text-fill-color": "transparent",
        },
        ".hover-dark-gradient": {
          background:
            "linear-gradient(191.03deg, rgba(10, 0, 15, 0) 41.63%, rgba(20, 0, 31, 0.5) 58.37%, #1F002E 75.11%)",
        },
        ".hover-gradient": {
          background:
            "linear-gradient(146.07deg, rgba(102, 0, 153, 0) 0%, #8800CC 49.98%, #AA00FF 99.95%)",
        },
        ".scrollbar-stamp": {
          "&::-webkit-scrollbar": {
            "width": "6px",
            "border-radius": "3px",
          },
          "&::-webkit-scrollbar-track": {
            "background-color": "var(--stamp-scrollbar-track)",
            "border-radius": "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            "background-color": "var(--stamp-scrollbar-thumb)",
            "border-radius": "3px",
            "&:hover": {
              "background-color": "var(--stamp-scrollbar-hover)",
            },
          },
        },
        ":root": {
          "--stamp-scrollbar-track": "#333333",
          "--stamp-scrollbar-thumb": "#660099",
          "--stamp-scrollbar-hover": "#aa00ff",
        },
        ".gradient-text": {
          "@apply bg-clip-text text-fill-transparent": {},
        },
      });
    }),
  ],
} satisfies Config;
