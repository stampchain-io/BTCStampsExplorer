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
        "conic-pattern":
          "repeating-conic-gradient(rgba(128, 128, 128, 0.2) 0% 25%, rgba(128, 128, 128, 0.1) 25% 50%)",
      },
      animation: {
        "fade-in": "fadeIn",
        "fade-out": "fadeOut",
        "slide-up": "slideUp",
        "slide-down": "slideDown",
        "slide-left": "slideLeft",
        "slide-right": "slideRight",
        "rotate": "rotate 4s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "100%": { transform: "translateX(30px)", opacity: "1" },
        },
        rotate: {
          "0%": { "--angle": "0deg" },
          "100%": { "--angle": "360deg" },
        },
      },
      spacing: {
        // PAGE GUTTERS (horizontal padding from screen edges to header, footer and body)
        "gutter-mobile": "24px", // updated breakpoint naming convention
        "gutter-tablet": "36px", // updated breakpoint naming convention
        "gutter-desktop": "48px", // updated breakpoint naming convention

        // LAYOUT GAP (vertical spacing between the body, and the header and footer)
        // Defined in the header and footer files - /islands/layout/

        // SECTION GAPS (vertical spacing between sections in the body)
        // Defined in /components/layout/styles.ts

        // GRID GAPS (spacing between grid/flex items)
        // Defined in /components/layout/styles.ts

        // PARAGRAPH GAP (vertical spacing between paragraphs)
        // Defined in the static.css file

        // CONTENT PADDING
        // STACK SPACING
        "margin-mobile": "18px", // not updated - needs attention
        "margin-tablet": "36px", // not updated - needs attention
        "margin-desktop": "72px", // not updated - needs attention
        "padding-mobile": "12px", // not updated - needs attention
        "padding-tablet": "24px", // not updated - needs attention
        "padding-desktop": "48px", // not updated - needs attention
        // CALCULATIONS
        "calc-12": "calc(100% - 12px)",
        "calc-24": "calc(100% - 24px)",
        "calc-36": "calc(100% - 36px)",
        // STAMP CARD AND MISC OTHER DIMENSIONS
        "stamp-card": "6px",
        "stamp-card-lg": "max(6px,min(12px,calc(6px+((100vw-360px)*0.029))))",
        "search-icon": "12px",
        "stroke-width": "2px",
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
        ".text-stroke-glow-large": {
          "text-shadow": `
            /* Glow effect */
            -0.05em -0.05em 0.25em #80C,    /* top-left */
            0.05em -0.05em 0.25em #80C,     /* top-right */
            0.05em 0.05em 0.25em #80C,      /* bottom-right */
            -0.05em 0.05em 0.25em #80C,     /* bottom-left */
            -0.05em 0 0.25em #80C,         /* left */
            0.05em 0 0.25em #80C,          /* right */
            0 -0.05em 0.25em #80C,         /* top */
            0 0.05em 0.25em #80C,          /* bottom */
            
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
        ".text-stroke-glow-small": {
          "text-shadow": `
            /* Glow effect */
            -0.02em -0.02em 0.3em #80C,  /* top-left */
            0.02em -0.02em 0.3em #80C,   /* top-right */
            0.02em 0.02em 0.3em #80C,    /* bottom-right */
            -0.02em 0.02em 0.3em #80C,   /* bottom-left */
            -0.02em 0 0.3em #80C,         /* left */
            0.02em 0 0.3em #80C,          /* right */
            0 -0.02em 0.3em #80C,         /* top */
            0 0.02em 0.3em #80C,          /* bottom */
            
            /* Stroke effect */
            -2px -2px 0 #A0F,
            2px -2px 0 #A0F,
            -2px 2px 0 #A0F,
            2px 2px 0 #A0F,
            -2px 0 0 #A0F,
            2px 0 0 #A0F,
            0 -2px 0 #A0F,
            0 2px 0 #A0F
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
            "linear-gradient(180deg, rgba(10, 0, 15, 0) 55%, rgba(20, 0, 31, 0.5) 70%, #1F002E 85%)",
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
        "*::-webkit-scrollbar-corner": {
          "background-color": "transparent !important",
        },
        ".gradient-text": {
          "@apply bg-clip-text text-fill-transparent": {},
        },
        "html *:focus-visible": {
          "outline": "2px solid #CCCCCCBF !important",
          "outline-offset": "-2px !important",
          "outline-style": "solid !important",
        },
      });
    }),
  ],
} satisfies Config;
