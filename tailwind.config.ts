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
        // New semantic color palette (Phase 1)
        color: {
          primary: {
            dark: "#220033",
            semidark: "#440066",
            DEFAULT: "#660099",
            semilight: "#8800CC",
            light: "#AA00FF",
          },
          neutral: {
            dark: "#333333",
            semidark: "#666666",
            DEFAULT: "#999999",
            semilight: "#CCCCCC",
            light: "#FFFFFF",
          },
        },
      },
      backgroundImage: {
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
        // CUSTOM SPACING
        "3.5": "14px",
        "7.5": "30px",

        // PAGE GUTTERS (horizontal padding from screen edges to header, footer and body containers)
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
          // Stamp color palette as CSS variables
          "--color-primary-dark": "#220033",
          "--color-primary-semidark": "#440066",
          "--color-primary": "#660099",
          "--color-primary-semilight": "#8800CC",
          "--color-primary-semilight-bright": "#AA00FF",
          "--color-neutral-light": "#CCCCCC",
          "--color-neutral": "#999999",
          "--color-neutral-semidark": "#666666",
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
        // Text Gradient Classes - Purple variants
        ".purple-gradient1": {
          "background":
            "linear-gradient(to right, var(--color-primary-semidark), var(--color-primary), var(--color-primary-semilight))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".purple-gradient2": {
          "background":
            "linear-gradient(to right, var(--color-primary-semidark), var(--color-primary), var(--color-primary-semilight), var(--color-primary-semilight-bright))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".purple-gradient3": {
          "background":
            "linear-gradient(to right, var(--color-primary-semilight), var(--color-primary), var(--color-primary-semidark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".purple-gradient4": {
          "background":
            "linear-gradient(to right, var(--color-primary-semilight-bright), var(--color-primary-semilight), var(--color-primary), var(--color-primary-semidark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        // Text Gradient Classes - Gray variants
        ".gray-gradient1": {
          "background":
            "linear-gradient(to right, var(--color-neutral-light), var(--color-neutral), var(--color-neutral-semidark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".gray-gradient2": {
          "background":
            "linear-gradient(to right, var(--color-neutral), var(--color-neutral-semidark))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        ".gray-gradient3": {
          "background":
            "linear-gradient(to right, var(--color-neutral-semidark), var(--color-neutral), var(--color-neutral-light))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".gray-gradient4": {
          "background":
            "linear-gradient(to right, var(--color-neutral-semidark), var(--color-neutral))",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
        },
        // Hoverable Text Gradients
        ".purple-gradient2-hover": {
          "background":
            "linear-gradient(90deg, var(--color-primary-semidark) 0%, var(--color-primary) 50%, var(--color-primary-semilight) 75%, var(--color-primary-semilight-bright) 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition": "background 0.3s ease-in-out",
          "&:hover": {
            "background":
              "linear-gradient(90deg, var(--color-primary-semidark) 0%, var(--color-primary) 25%, var(--color-primary-semilight) 50%, var(--color-primary-semilight-bright) 75%)",
          },
        },
        ".purple-gradient4-hover": {
          "background":
            "linear-gradient(90deg, var(--color-primary-semilight-bright) 30%, var(--color-primary-semilight) 60%, var(--color-primary) 90%, var(--color-primary-semidark) 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition": "background 0.3s ease-in-out",
          "&:hover": {
            "background":
              "linear-gradient(90deg, var(--color-primary-semilight-bright) 50%, var(--color-primary-semilight) 80%, var(--color-primary) 90%, var(--color-primary-semidark) 100%)",
          },
        },
        ".gray-gradient1-hover": {
          "background":
            "linear-gradient(to right, var(--color-neutral-light), var(--color-neutral), var(--color-neutral-semidark))",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.3s ease-in-out, -webkit-text-fill-color 0.3s ease-in-out, text-fill-color 0.3s ease-in-out",
          "&:hover": {
            "background": "none",
            "-webkit-text-fill-color": "var(--color-neutral-light)",
            "text-fill-color": "var(--color-neutral-light)",
          },
        },
        ".gray-gradient3-hover": {
          "background":
            "linear-gradient(to right, var(--color-neutral-semidark), var(--color-neutral), var(--color-neutral-light))",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
          "text-fill-color": "transparent",
          "transition":
            "background 0.3s ease-in-out, -webkit-text-fill-color 0.3s ease-in-out, text-fill-color 0.3s ease-in-out",
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
