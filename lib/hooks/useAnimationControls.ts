import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import type { RefObject } from "preact";

// Global animation state
interface AnimationState {
  pageVisible: boolean;
  reducedMotion: boolean;
  performanceMode: "high" | "medium" | "low";
}

// Global animation controls
class AnimationManager {
  private static instance: AnimationManager;
  private state: AnimationState = {
    pageVisible: true,
    reducedMotion: false,
    performanceMode: "high",
  };
  private observers: Set<IntersectionObserver> = new Set();
  private listeners: Set<(state: AnimationState) => void> = new Set();

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  constructor() {
    if (IS_BROWSER) {
      this.initializePageVisibility();
      this.initializeReducedMotion();
      this.initializePerformanceDetection();
    }
  }

  private initializePageVisibility() {
    const handleVisibilityChange = () => {
      this.updateState({ pageVisible: !document.hidden });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Handle page focus/blur as backup
    globalThis.addEventListener(
      "focus",
      () => this.updateState({ pageVisible: true }),
    );
    globalThis.addEventListener(
      "blur",
      () => this.updateState({ pageVisible: false }),
    );
  }

  private initializeReducedMotion() {
    const mediaQuery = globalThis.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    this.updateState({ reducedMotion: mediaQuery.matches });

    mediaQuery.addEventListener("change", (e) => {
      this.updateState({ reducedMotion: e.matches });
    });
  }

  private initializePerformanceDetection() {
    // Detect performance capabilities
    const connection = (navigator as any).connection;
    const memory = (performance as any).memory;

    let performanceMode: "high" | "medium" | "low" = "high";

    // Check network connection
    if (connection) {
      if (
        connection.effectiveType === "2g" ||
        connection.effectiveType === "slow-2g"
      ) {
        performanceMode = "low";
      } else if (connection.effectiveType === "3g") {
        performanceMode = "medium";
      }
    }

    // Check memory constraints
    if (memory && memory.jsHeapSizeLimit < 1000000000) { // Less than 1GB
      performanceMode = "low";
    }

    // Check hardware concurrency
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      performanceMode = performanceMode === "high" ? "medium" : "low";
    }

    this.updateState({ performanceMode });
  }

  private updateState(updates: Partial<AnimationState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.updateGlobalClasses();
  }

  private updateGlobalClasses() {
    if (!IS_BROWSER) return;

    const body = document.body;

    // Page visibility
    body.classList.toggle("page-hidden", !this.state.pageVisible);
    body.classList.toggle("page-visible", this.state.pageVisible);

    // Reduced motion
    body.classList.toggle("reduced-motion", this.state.reducedMotion);

    // Performance mode
    body.classList.remove(
      "performance-high",
      "performance-medium",
      "performance-low",
    );
    body.classList.add(`performance-${this.state.performanceMode}`);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: (state: AnimationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): AnimationState {
    return { ...this.state };
  }

  public shouldAnimate(): boolean {
    return this.state.pageVisible && !this.state.reducedMotion;
  }

  public shouldAnimateInViewport(): boolean {
    return this.shouldAnimate() && this.state.performanceMode !== "low";
  }

  public createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit,
  ): IntersectionObserver | null {
    if (!IS_BROWSER) return null;

    const observer = new IntersectionObserver(callback, {
      rootMargin: "50px",
      threshold: 0.1,
      ...options,
    });

    this.observers.add(observer);
    return observer;
  }

  public cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.listeners.clear();
  }
}

// Hook for using animation controls
export const useAnimationControls = () => {
  const [state, setState] = useState<AnimationState>(() =>
    AnimationManager.getInstance().getState()
  );

  useEffect(() => {
    const manager = AnimationManager.getInstance();
    const unsubscribe = manager.subscribe(setState);

    return unsubscribe;
  }, []);

  return {
    ...state,
    shouldAnimate: AnimationManager.getInstance().shouldAnimate(),
    shouldAnimateInViewport: AnimationManager.getInstance()
      .shouldAnimateInViewport(),
    manager: AnimationManager.getInstance(),
  };
};

// Hook for viewport-based animation control
export const useInViewportAnimation = (
  elementRef: RefObject<HTMLElement>,
  options?: IntersectionObserverInit,
) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [hasBeenInViewport, setHasBeenInViewport] = useState(false);
  const { shouldAnimateInViewport, manager } = useAnimationControls();

  useEffect(() => {
    if (!elementRef.current || !shouldAnimateInViewport) return;

    const observer = manager.createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inViewport = entry.isIntersecting;
          setIsInViewport(inViewport);

          if (inViewport && !hasBeenInViewport) {
            setHasBeenInViewport(true);
          }
        });
      },
      options,
    );

    if (observer && elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [
    elementRef,
    shouldAnimateInViewport,
    hasBeenInViewport,
    manager,
    options,
  ]);

  return {
    isInViewport,
    hasBeenInViewport,
    shouldAnimate: shouldAnimateInViewport && isInViewport,
  };
};

// Hook for enhanced loading skeleton with viewport awareness
export const useEnhancedLoadingSkeleton = (
  isLoading: boolean,
  baseClasses: string = "loading-skeleton",
  elementRef?: RefObject<HTMLElement>,
) => {
  const { shouldAnimate } = useAnimationControls();
  const viewportData = elementRef ? useInViewportAnimation(elementRef) : null;

  const shouldShowAnimation = shouldAnimate &&
    (viewportData ? viewportData.shouldAnimate : true);

  return {
    className: `${baseClasses} ${
      isLoading && shouldShowAnimation
        ? "running"
        : isLoading
        ? "paused"
        : "completed"
    }`,
    isAnimating: isLoading && shouldShowAnimation,
  };
};

export default AnimationManager;
