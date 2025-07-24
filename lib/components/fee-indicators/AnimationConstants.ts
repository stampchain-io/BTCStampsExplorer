/* ===== ANIMATION CONSTANTS - MATCHING STAMPINGTOOL EXCELLENCE ===== */

import type { AnimationConfig, PhaseTransitionConfig } from "./types.ts";

/* ===== TIMING CONSTANTS ===== */

export const ANIMATION_TIMINGS = {
  // Fast animations for immediate feedback
  fast: "150ms",

  // Normal animations for smooth transitions (matches StampingTool)
  normal: "300ms",

  // Slow animations for emphasis
  slow: "600ms",

  // Pulse animation timing (matches StampingTool's animate-pulse)
  pulse: "2s",

  // Ping animation timing (matches StampingTool's animate-ping)
  ping: "1s",
} as const;

/* ===== EASING FUNCTIONS ===== */

export const EASING_FUNCTIONS = {
  // Smooth ease for most transitions
  ease: "ease",

  // Cubic bezier for sophisticated animations (matches Tailwind)
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",

  // Spring-like easing for delightful interactions
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",

  // Linear for progress indicators
  linear: "linear",
} as const;

/* ===== PHASE TRANSITION ANIMATIONS ===== */

export const PHASE_TRANSITIONS: Record<string, PhaseTransitionConfig> = {
  // Instant → Cached transition
  "instant-to-cached": {
    from: "instant",
    to: "cached",
    animation: {
      name: "phaseTransition",
      keyframes: [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0.8, transform: "scale(1.1)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      options: {
        duration: 300,
        easing: EASING_FUNCTIONS.easeInOut,
        fill: "forwards",
      },
    },
  },

  // Cached → Exact transition
  "cached-to-exact": {
    from: "cached",
    to: "exact",
    animation: {
      name: "phaseComplete",
      keyframes: [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0.9, transform: "scale(1.05)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      options: {
        duration: 300,
        easing: EASING_FUNCTIONS.easeInOut,
        fill: "forwards",
      },
    },
  },
} as const;

/* ===== LOADING ANIMATIONS (MATCHING STAMPINGTOOL) ===== */

export const LOADING_ANIMATIONS: Record<string, AnimationConfig> = {
  // Pulse animation (matches StampingTool's animate-pulse)
  pulse: {
    name: "pulse",
    keyframes: [
      { opacity: 1 },
      { opacity: 0.5 },
      { opacity: 1 },
    ],
    options: {
      duration: 2000,
      easing: EASING_FUNCTIONS.easeInOut,
      iterations: Infinity,
    },
  },

  // Ping animation (matches StampingTool's animate-ping)
  ping: {
    name: "ping",
    keyframes: [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(2)", opacity: 0 },
    ],
    options: {
      duration: 1000,
      easing: EASING_FUNCTIONS.easeInOut,
      iterations: Infinity,
    },
  },

  // Spin animation for loading states
  spin: {
    name: "spin",
    keyframes: [
      { transform: "rotate(0deg)" },
      { transform: "rotate(360deg)" },
    ],
    options: {
      duration: 1000,
      easing: EASING_FUNCTIONS.linear,
      iterations: Infinity,
    },
  },
} as const;

/* ===== PHASE STATUS ANIMATIONS ===== */

export const PHASE_STATUS_ANIMATIONS: Record<string, AnimationConfig> = {
  // Success animation for completed phases
  success: {
    name: "success",
    keyframes: [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(1.2)", opacity: 0.8 },
      { transform: "scale(1)", opacity: 1 },
    ],
    options: {
      duration: 400,
      easing: EASING_FUNCTIONS.spring,
      fill: "forwards",
    },
  },

  // Error animation for failed phases
  error: {
    name: "error",
    keyframes: [
      { transform: "translateX(0)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(0)" },
    ],
    options: {
      duration: 400,
      easing: EASING_FUNCTIONS.ease,
      fill: "forwards",
    },
  },

  // Fade in animation for new phases
  fadeIn: {
    name: "fadeIn",
    keyframes: [
      { opacity: 0, transform: "translateY(-4px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    options: {
      duration: 300,
      easing: EASING_FUNCTIONS.easeInOut,
      fill: "forwards",
    },
  },
} as const;

/* ===== UTILITY ANIMATION FUNCTIONS ===== */

export const ANIMATION_UTILITIES = {
  // Get animation duration in milliseconds
  getDuration: (timing: keyof typeof ANIMATION_TIMINGS): number => {
    return parseInt(
      ANIMATION_TIMINGS[timing].replace("ms", "").replace("s", "000"),
    );
  },

  // Create CSS animation string
  createAnimationString: (
    name: string,
    duration: string,
    easing: string,
    iterations: number | "infinite" = 1,
    direction: string = "normal",
  ): string => {
    return `${name} ${duration} ${easing} ${iterations} ${direction}`;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
} as const;
