import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],

  theme: {
    screens: {
      "mobile-sm": "420px",
      "mobile-md": "569px",
      "mobile-lg": "769px",
      "tablet": "1025px",
      "desktop": "1440px",
      "xs": "420px",
      "sm": "569px",
      "md": "769px",
      "lg": "769px",
      "xl": "1025px",
      "2xl": "1440px",
    },
    extend: {
      fontFamily: {
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
            DEFAULT: "#5503A6",
            light: "#4F3666",
            dark: "#3E2F4C",
            accent: "#7A00F5",
            highlight: "#AA00FF",
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
          },
          input: {
            bg: "#4F3666",
            border: "#8A8989",
          },
          search: {
            placeholder: "#8D9199",
            background: "#660099",
          },
        },
      },
      backgroundImage: {
        "stamp-primary":
          "linear-gradient(141deg, rgba(10, 0, 15, 0) 0%, #14001F 50%, #1F002E 100%)",
        "stamp-dark":
          "linear-gradient(to bottom right, #1f002e00, #14001f7f, #1f002eff)",
        "purple-gradient": "linear-gradient(to right, #8800CC, #AA00FF)",
        "dark-gradient": "linear-gradient(to right, #0B0B0B, #1F002E)",
        "text-gray": "linear-gradient(to right, #666666, #999999)",
        "text-purple": "linear-gradient(to right, #8800CC, #AA00FF)",
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
        "stamp-purple-bg":
          "linear-gradient(to right, #8800cc, #7700aa, #660099)",
        "text-purple-hover": {
          DEFAULT:
            "linear-gradient(90deg, #440066 0%, #660099 50%, #8800cc 75%, #aa00ff 100%)",
          hover:
            "linear-gradient(90deg, #440066 0%, #660099 25%, #8800cc 50%, #aa00ff 75%)",
        },
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
      },
      borderRadius: {
        "stamp": "6px",
      },
      boxShadow: {
        "stamp": "0px 0px 30px #aa00ff",
        "stamp-hover": "0px 0px 40px #aa00ff",
      },
      aspectRatio: {
        "stamp": "1",
      },
      zIndex: {
        "modal": "50",
        "tooltip": "40",
        "dropdown": "30",
      },
    },
  },
  target: {
    safari: "14",
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".bg-clip-text": {
          "-webkit-background-clip": "text",
          "background-clip": "text",
        },
        ".text-fill-transparent": {
          "-webkit-text-fill-color": "transparent",
          "text-fill-color": "transparent",
        },
        ".hover-gradient": {
          "&:hover": {
            "background-image": "var(--tw-gradient-hover)",
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;
