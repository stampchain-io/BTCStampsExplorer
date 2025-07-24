/**
 * Fee Animation Hook
 *
 * Provides animation controls for fee indicators
 * Based on StampingTool patterns
 */

import { useEffect, useRef, useState } from "preact/hooks";
import { animationUtils } from "$lib/components/fee-indicators/AnimationUtilities.ts";
import type { AnimationConfig } from "$lib/components/fee-indicators/types.ts";

interface UseFeeAnimationsOptions {
  /** Enable pulse animation for active phases */
  enablePulse?: boolean;
  /** Enable ping animation for attention */
  enablePing?: boolean;
  /** Animation duration override */
  duration?: string;
  /** Custom easing function */
  easing?: string;
}

interface UseFeeAnimationsReturn {
  /** Apply animation to an element */
  applyAnimation: (
    element: HTMLElement,
    type: "pulse" | "ping" | "success" | "error",
  ) => void;
  /** Check if animations are reduced */
  prefersReducedMotion: boolean;
  /** Get animation classes for a phase */
  getAnimationClasses: (
    phase: "instant" | "cached" | "exact",
    isActive: boolean,
  ) => string;
  /** Animation state */
  isAnimating: boolean;
}

/**
 * Hook for managing fee indicator animations
 */
export function useFeeAnimations(
  options: UseFeeAnimationsOptions = {},
): UseFeeAnimationsReturn {
  const {
    enablePulse = true,
    enablePing = true,
    duration,
    easing,
  } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<Animation | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  /**
   * Apply animation to an element
   */
  const applyAnimation = (
    element: HTMLElement,
    type: "pulse" | "ping" | "success" | "error",
  ) => {
    if (prefersReducedMotion) return;

    // Cancel any existing animation
    if (animationRef.current) {
      animationRef.current.cancel();
    }

    setIsAnimating(true);

    switch (type) {
      case "pulse":
        if (enablePulse) {
          animationRef.current = animationUtils.applyPulseAnimation(element, {
            duration: duration || "2s",
            easing: easing || "ease-in-out",
          });
        }
        break;
      case "ping":
        if (enablePing) {
          animationRef.current = animationUtils.applyPingAnimation(element, {
            duration: duration || "1s",
            easing: easing || "cubic-bezier(0, 0, 0.2, 1)",
          });
        }
        break;
      case "success":
        animationUtils.animateSuccess(element);
        setTimeout(() => setIsAnimating(false), 300);
        break;
      case "error":
        animationUtils.animateError(element);
        setTimeout(() => setIsAnimating(false), 300);
        break;
    }

    // Set animation complete callback
    if (animationRef.current) {
      animationRef.current.onfinish = () => {
        setIsAnimating(false);
      };
    }
  };

  /**
   * Get animation classes for a phase
   */
  const getAnimationClasses = (
    phase: "instant" | "cached" | "exact",
    isActive: boolean,
  ): string => {
    if (prefersReducedMotion) return "";

    const classes: string[] = [];

    if (isActive) {
      if (phase === "cached" && enablePulse) {
        classes.push("animate-pulse");
      }
      if (phase === "exact" && enablePing) {
        classes.push("animate-ping");
      }
    }

    return classes.join(" ");
  };

  return {
    applyAnimation,
    prefersReducedMotion,
    getAnimationClasses,
    isAnimating,
  };
}
