import { type Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
        color: { // colors are also defined as CSS variables further down in the doc - update both
          primary: {
            dark: "#43005c",
            semidark: "#610085",
            DEFAULT: "#7f00ad",
            semilight: "#9d00d6",
            light: "#BB00FF",
          },
          neutral: {
            dark: "#595653",
            semidark: "#86827d",
            DEFAULT: "#aca7a1",
            semilight: "#d8d2ca",
            light: "#fff8f0",
          },
        },
      },
      backgroundImage: {
        "conic-pattern": "var(--conic-pattern)",
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
        // CUSTOM SPACING
        "3.5": "14px",
        "7.5": "30px",

        // PAGE GUTTERS (horizontal padding from left/rightscreen edges to header, footer and body containers)
        "gutter-mobile": "20px", // updated breakpoint naming convention
        "gutter-tablet": "20px", // updated breakpoint naming convention
        "gutter-desktop": "40px", // updated breakpoint naming convention

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
        "stamp": "0px 0px 18px #aa00ff",
        "stamp-hover": "0px 0px 24px #aa00ff",
      },
      aspectRatio: {
        "stamp": "1",
      },
      zIndex: {
        "notification": "60",
        "modal": "50",
        "tooltip": "40",
        "dropdown": "30",
        "header": "20",
      },
      maxWidth: {
        "desktop": "1920px",
        "none": "none",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }: any) {
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
        ".bg-clip-text": { // @baba - prune and refactor
          "-webkit-background-clip": "text",
          "background-clip": "text",
        },
        ".text-fill-transparent": { // prune and refactor
          "-webkit-text-fill-color": "transparent",
          "text-fill-color": "transparent",
        },
        ".hover-dark-gradient": { // prune and refactor
          background:
            "linear-gradient(180deg, rgba(10, 0, 15, 0) 55%, rgba(20, 0, 31, 0.5) 70%, #1F002E 85%)",
        },
        ".hover-gradient": { // prune and refactor
          background:
            "linear-gradient(146.07deg, rgba(102, 0, 153, 0) 0%, #8800CC 49.98%, #AA00FF 99.95%)",
        },
        ".scrollbar-hide": {
          /* Hide scrollbar for IE, Edge and Firefox */
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          /* Hide scrollbar for Chrome, Safari and Opera */
          "&::-webkit-scrollbar": {
            "display": "none",
          },
        },
        ":root": {
          // Primary color palette as CSS variables
          "--color-primary-dark": "#43005c",
          "--color-primary-semidark": "#610085",
          "--color-primary": "#7f00ad",
          "--color-primary-semilight": "#9d00d6",
          "--color-primary-light": "#BB00FF",
          // Neutral color palette as CSS variables
          "--color-neutral-dark": "#595653",
          "--color-neutral-semidark": "#86827d",
          "--color-neutral": "#aca7a1",
          "--color-neutral-semilight": "#d8d2ca",
          "--color-neutral-light": "#fff8f0",
          // Conic gradient variables
          "--conic-pattern":
            "repeating-conic-gradient(rgba(128, 128, 128, 0.2) 0% 25%, rgba(128, 128, 128, 0.1) 25% 50%)",
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
        // Gradient Classes - Primary variants
        ".color-primary-gradientDL": {
          "background":
            "linear-gradient(to right, var(--color-primary-dark), var(--color-primary-semidark), var(--color-primary), var(--color-primary-semilight), var(--color-primary-light))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".color-primary-gradientDL-hover": {
          "background":
            "linear-gradient(to right, var(--color-primary-dark), var(--color-primary-semidark), var(--color-primary), var(--color-primary-semilight), var(--color-primary-light))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.2s ease-in-out, -webkit-text-fill-color 0.2s ease-in-out, text-fill-color 0.2s ease-in-out",
          "&:hover": {
            "background": "none",
            "-webkit-text-fill-color": "var(--color-primary-light)",
            "text-fill-color": "var(--color-primary-light)",
          },
        },
        ".color-primary-gradientLD": {
          "background":
            "linear-gradient(to right, var(--color-primary-light), var(--color-primary-semilight), var(--color-primary), var(--color-primary-semidark), var(--color-primary-dark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".color-primary-gradientLD-hover": {
          "background":
            "linear-gradient(to right, var(--color-primary-light), var(--color-primary-semilight), var(--color-primary), var(--color-primary-semidark), var(--color-primary-dark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.2s ease-in-out, -webkit-text-fill-color 0.2s ease-in-out, text-fill-color 0.2s ease-in-out",
          "&:hover": {
            "background": "none",
            "-webkit-text-fill-color": "var(--color-primary-light)",
            "text-fill-color": "var(--color-primary-light)",
          },
        },

        // Gradient Classes - Neutral variants
        ".color-neutral-gradientLD": {
          "background":
            "linear-gradient(to right, var(--color-neutral-light), var(--color-neutral-semilight), var(--color-neutral), var(--color-neutral-semidark), var(--color-neutral-dark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".color-neutral-gradientLD-hover": {
          "background":
            "linear-gradient(to right, var(--color-neutral-light), var(--color-neutral-semilight), var(--color-neutral), var(--color-neutral-semidark), var(--color-neutral-dark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.2s ease-in-out, -webkit-text-fill-color 0.2s ease-in-out, text-fill-color 0.2s ease-in-out",
          "&:hover": {
            "background": "none",
            "-webkit-text-fill-color": "var(--color-neutral-light)",
            "text-fill-color": "var(--color-neutral-light)",
          },
        },
        ".color-neutral-gradientDL": {
          "background":
            "linear-gradient(to right, var(--color-neutral-dark), var(--color-neutral-semidark), var(--color-neutral), var(--color-neutral-semilight), var(--color-neutral-light))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".color-neutral-gradientDL-hover": {
          "background":
            "linear-gradient(to right, var(--color-neutral-dark), var(--color-neutral-semidark), var(--color-neutral), var(--color-neutral-semilight), var(--color-neutral-light))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.2s ease-in-out, -webkit-text-fill-color 0.2s ease-in-out, text-fill-color 0.2s ease-in-out",
          "&:hover": {
            "background": "none",
            "-webkit-text-fill-color": "var(--color-neutral-light)",
            "text-fill-color": "var(--color-neutral-light)",
          },
        },
      });
    }),
  ],
} satisfies Config;
