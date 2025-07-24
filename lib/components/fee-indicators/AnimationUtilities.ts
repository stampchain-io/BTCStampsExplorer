/* ===== ANIMATION UTILITIES - OPTIONAL ADOPTION FOR EXISTING TOOLS ===== */

import {
  ANIMATION_UTILITIES as CONSTANTS,
  LOADING_ANIMATIONS,
  PHASE_STATUS_ANIMATIONS,
  PHASE_TRANSITIONS,
} from "./AnimationConstants.ts";
import type {
  AnimationConfig,
  AnimationUtilityProps,
  FeeEstimationPhase,
} from "./types.ts";

/* ===== CORE ANIMATION UTILITIES CLASS ===== */

export class AnimationUtilities {
  private static instance: AnimationUtilities;
  private animationCache = new Map<string, Animation>();

  private constructor() {}

  static getInstance(): AnimationUtilities {
    if (!AnimationUtilities.instance) {
      AnimationUtilities.instance = new AnimationUtilities();
    }
    return AnimationUtilities.instance;
  }

  /* ===== PHASE TRANSITION ANIMATIONS ===== */

  /**
   * Animate phase transition (optional utility for existing tools)
   * Matches StampingTool's smooth transitions
   */
  async animatePhaseTransition(
    element: HTMLElement,
    from: FeeEstimationPhase,
    to: FeeEstimationPhase,
    options?: Partial<AnimationUtilityProps>,
  ): Promise<void> {
    const transitionKey = `${from}-to-${to}`;
    const config = PHASE_TRANSITIONS[transitionKey];

    if (!config) {
      console.warn(`No transition defined for ${from} → ${to}`);
      return;
    }

    // Respect user's motion preferences
    if (CONSTANTS.prefersReducedMotion()) {
      return;
    }

    const animationOptions = {
      ...config.animation.options,
      ...options,
    };

    // Convert iterations to number if it's "Infinity"
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.animation.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    return new Promise((resolve) => {
      animation.addEventListener("finish", () => resolve());
    });
  }

  /* ===== LOADING ANIMATIONS ===== */

  /**
   * Apply pulse animation (matches StampingTool's animate-pulse)
   */
  applyPulseAnimation(
    element: HTMLElement,
    options?: Partial<AnimationUtilityProps>,
  ): Animation {
    const config = LOADING_ANIMATIONS.pulse;

    if (CONSTANTS.prefersReducedMotion()) {
      return element.animate([], { duration: 0 });
    }

    const animationOptions = {
      ...config.options,
      ...options,
    };

    // Convert iterations to number if needed
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    const cacheKey = `pulse-${element.id || Math.random()}`;
    this.animationCache.set(cacheKey, animation);

    return animation;
  }

  /**
   * Apply ping animation (matches StampingTool's animate-ping)
   */
  applyPingAnimation(
    element: HTMLElement,
    options?: Partial<AnimationUtilityProps>,
  ): Animation {
    const config = LOADING_ANIMATIONS.ping;

    if (CONSTANTS.prefersReducedMotion()) {
      return element.animate([], { duration: 0 });
    }

    const animationOptions = {
      ...config.options,
      ...options,
    };

    // Convert iterations to number if needed
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    const cacheKey = `ping-${element.id || Math.random()}`;
    this.animationCache.set(cacheKey, animation);

    return animation;
  }

  /* ===== STATUS ANIMATIONS ===== */

  /**
   * Animate success state (for completed phases)
   */
  async animateSuccess(
    element: HTMLElement,
    options?: Partial<AnimationUtilityProps>,
  ): Promise<void> {
    const config = PHASE_STATUS_ANIMATIONS.success;

    if (CONSTANTS.prefersReducedMotion()) {
      return;
    }

    const animationOptions = {
      ...config.options,
      ...options,
    };

    // Convert iterations to number if needed
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    return new Promise((resolve) => {
      animation.addEventListener("finish", () => resolve());
    });
  }

  /**
   * Animate error state (for failed phases)
   */
  async animateError(
    element: HTMLElement,
    options?: Partial<AnimationUtilityProps>,
  ): Promise<void> {
    const config = PHASE_STATUS_ANIMATIONS.error;

    if (CONSTANTS.prefersReducedMotion()) {
      return;
    }

    const animationOptions = {
      ...config.options,
      ...options,
    };

    // Convert iterations to number if needed
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    return new Promise((resolve) => {
      animation.addEventListener("finish", () => resolve());
    });
  }

  /**
   * Animate fade in (for new phase indicators)
   */
  async animateFadeIn(
    element: HTMLElement,
    options?: Partial<AnimationUtilityProps>,
  ): Promise<void> {
    const config = PHASE_STATUS_ANIMATIONS.fadeIn;

    if (CONSTANTS.prefersReducedMotion()) {
      element.style.opacity = "1";
      return;
    }

    const animationOptions = {
      ...config.options,
      ...options,
    };

    // Convert iterations to number if needed
    if (animationOptions.iterations === "Infinity") {
      animationOptions.iterations = Infinity;
    }

    const animation = element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );

    return new Promise((resolve) => {
      animation.addEventListener("finish", () => resolve());
    });
  }

  /* ===== UTILITY FUNCTIONS ===== */

  /**
   * Create custom animation from config
   */
  createCustomAnimation(
    element: HTMLElement,
    config: AnimationConfig,
    options?: Partial<AnimationUtilityProps>,
  ): Animation {
    if (CONSTANTS.prefersReducedMotion()) {
      return element.animate([], { duration: 0 });
    }

    const animationOptions: any = {
      ...config.options,
      ...options,
    };

    // Convert iterations to proper type
    if (
      animationOptions.iterations === "Infinity" ||
      animationOptions.iterations === "infinite"
    ) {
      animationOptions.iterations = Infinity;
    }

    return element.animate(
      config.keyframes,
      animationOptions as KeyframeAnimationOptions,
    );
  }

  /**
   * Stop all animations on element
   */
  stopAnimations(element: HTMLElement): void {
    const animations = element.getAnimations();
    animations.forEach((animation) => animation.cancel());
  }

  /**
   * Cleanup cached animations
   */
  cleanup(): void {
    this.animationCache.forEach((animation) => animation.cancel());
    this.animationCache.clear();
  }

  /* ===== CONVENIENCE METHODS FOR EXISTING TOOLS ===== */

  /**
   * Get StampingTool-style phase indicator classes
   * Returns CSS classes that match existing implementations
   */
  getPhaseIndicatorClasses(
    phase: FeeEstimationPhase,
    isActive: boolean = false,
    isComplete: boolean = false,
    hasError: boolean = false,
  ): string {
    const baseClasses = "w-1.5 h-1.5 rounded-full transition-all duration-300";

    if (hasError) {
      return `${baseClasses} bg-red-400`;
    }

    if (isComplete) {
      return `${baseClasses} bg-green-400`;
    }

    if (isActive) {
      const phaseColors = {
        instant: "bg-green-400 animate-pulse",
        cached: "bg-blue-400 animate-pulse",
        exact: "bg-orange-400 animate-pulse",
      };
      return `${baseClasses} ${phaseColors[phase]}`;
    }

    return `${baseClasses} bg-stamp-grey-light/30`;
  }

  /**
   * Get phase icon (matches existing implementations)
   */
  getPhaseIcon(phase: FeeEstimationPhase): string {
    const icons = {
      instant: "⚡",
      cached: "💡",
      exact: "🎯",
    };
    return icons[phase];
  }

  /**
   * Get phase label for accessibility
   */
  getPhaseLabel(phase: FeeEstimationPhase): string {
    const labels = {
      instant: "Instant estimate",
      cached: "Smart UTXO analysis",
      exact: "Exact calculation",
    };
    return labels[phase];
  }
}

/* ===== SINGLETON EXPORT ===== */
export const animationUtils = AnimationUtilities.getInstance();
