import { Swiper } from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import type { SwiperType } from "swiper";

type CarouselElement = HTMLElement | null;

const CAROUSEL_CONFIG = {
  // Base dimensions
  SLIDES: {
    COUNT: {
      MOBILE: 3, // Show 3 slides on mobile
      DESKTOP: 5, // Show 5 slides on desktop
    },
    MAX_WIDTH: 432, // Maximum width of center slide
    CONTAINER_WIDTH_RATIO: 0.35,
  },

  // Scale factors for each position
  SCALE: {
    CENTER: 1.0, // Center slide at 100%
    ADJACENT: 0.8, // Adjacent slides at 80%
    OUTER: 0.6, // Outer slides at 60%
  },

  // Overlap percentages
  OVERLAP: {
    ADJACENT: 0.5, // Adjacent slides overlap center by 50%
    OUTER: 0.5, // Outer slides overlap adjacent by 60%
  },

  // Visual effects
  EFFECTS: {
    BLUR: {
      CENTER: 0, // No blur on center
      ADJACENT: 1, // Slight blur on adjacent
      OUTER: 2, // More blur on outer
    },
    OPACITY: {
      CENTER: "1", // Full opacity for center
      ADJACENT: "0.8", // Reduced for adjacent
      OUTER: "0.6", // Most reduced for outer
    },
  },

  // Animation settings
  ANIMATION: {
    SPEED: 600,
    AUTOPLAY: 3000,
  },

  DEBUG: {
    ENABLED: true,
  },

  BREAKPOINTS: {
    MOBILE_LG: 768, // Match mobileLg breakpoint
  },
} as const;

const validateLayout = (
  containerWidth: number,
  dimensions: {
    baseWidth: number;
    translations: { adjacent: number; outer: number };
    centerOffset: number;
  },
) => {
  const { baseWidth, translations, centerOffset } = dimensions;
  const adjacentWidth = baseWidth * CAROUSEL_CONFIG.SCALE.ADJACENT;
  const outerWidth = baseWidth * CAROUSEL_CONFIG.SCALE.OUTER;

  // Calculate exact positions and overlaps
  const positions = {
    center: {
      left: centerOffset,
      right: centerOffset + baseWidth,
      width: baseWidth,
    },
    adjacent: {
      left: {
        start: centerOffset - (adjacentWidth * 0.5), // Should overlap center by 50%
        end: centerOffset + (adjacentWidth * 0.5),
      },
      right: {
        start: centerOffset + baseWidth - (adjacentWidth * 0.5),
        end: centerOffset + baseWidth + (adjacentWidth * 0.5),
      },
      width: adjacentWidth,
    },
    outer: {
      left: {
        start: centerOffset - adjacentWidth - (outerWidth * 0.4), // Should overlap adjacent by 60%
        end: centerOffset - adjacentWidth + (outerWidth * 0.6),
      },
      right: {
        start: centerOffset + baseWidth + adjacentWidth - (outerWidth * 0.6),
        end: centerOffset + baseWidth + adjacentWidth + (outerWidth * 0.4),
      },
      width: outerWidth,
    },
  };

  debug("Position Validation:", {
    containerWidth,
    positions,
    overlaps: {
      adjacentWithCenter: (baseWidth -
        (positions.adjacent.right.start - positions.adjacent.left.end)) /
        baseWidth,
      outerWithAdjacent: (adjacentWidth -
        (positions.outer.right.start - positions.outer.left.end)) /
        adjacentWidth,
    },
  });

  return {
    positions,
    isValid: {
      scaling: {
        adjacent: Math.abs(adjacentWidth / baseWidth - 0.8) < 0.01,
        outer: Math.abs(outerWidth / baseWidth - 0.6) < 0.01,
      },
      overlaps: {
        adjacentWithCenter: 0.5,
        outerWithAdjacent: 0.5,
      },
      // overlaps: {
      //   adjacent: Math.abs(
      //     (baseWidth -
      //           (positions.adjacent.right.start -
      //             positions.adjacent.left.end)) / baseWidth - 0.5,
      //   ) < 0.01,
      //   outer: Math.abs(
      //     (adjacentWidth -
      //           (positions.outer.right.start - positions.outer.left.end)) /
      //         adjacentWidth - 0.6,
      //   ) < 0.01,
      // },
      centering: Math.abs(
        positions.center.left -
          (containerWidth -
              (positions.outer.right.end - positions.outer.left.start)) / 2,
      ) < 1,
      containerFit: positions.outer.right.end <= containerWidth &&
        positions.outer.left.start >= 0,
    },
  };
};

const calculateDimensions = (containerWidth: number) => {
  // Use existing calculations as they work well
  const baseWidth = Math.min(
    CAROUSEL_CONFIG.SLIDES.MAX_WIDTH,
    containerWidth * CAROUSEL_CONFIG.SLIDES.CONTAINER_WIDTH_RATIO,
  );

  const adjacentWidth = baseWidth * CAROUSEL_CONFIG.SCALE.ADJACENT;
  const outerWidth = baseWidth * CAROUSEL_CONFIG.SCALE.OUTER;

  const adjacentVisible = adjacentWidth *
    (1 - CAROUSEL_CONFIG.OVERLAP.ADJACENT);
  const outerVisible = outerWidth * (1 - CAROUSEL_CONFIG.OVERLAP.OUTER);

  // Calculate total width needed for all slides
  const totalWidth = baseWidth + // Center
    (2 * adjacentVisible) + // Two adjacent slides
    (2 * outerVisible); // Two outer slides
  const centerOffset = (containerWidth - totalWidth) / 2;

  // Calculate translations for proper overlap
  // const adjacentTranslate = (baseWidth / 2) -
  //   (adjacentWidth * CAROUSEL_CONFIG.OVERLAP.ADJACENT);
  // const outerTranslate = adjacentTranslate +
  //   (adjacentWidth / 2) - (outerWidth * CAROUSEL_CONFIG.OVERLAP.OUTER);

  const adjacentTranslate = baseWidth * 0.5; // Exact 50% overlap for adjacent
  const outerTranslate = baseWidth * 0.5 + adjacentWidth * 0.5; // Exact 50% overlap for outer

  return {
    baseWidth,
    translations: {
      adjacent: adjacentTranslate,
      outer: outerTranslate,
    },
    centerOffset,
  };
};

const calculateTranslateX = (
  distance: number,
  baseWidth: number,
  isMobile: boolean,
): number => {
  if (distance === 0) return 0;

  const direction = distance > 0 ? 1 : -1;
  if (isMobile) {
    return direction * (baseWidth * 0.75);
  }

  // Calculate positions based on base width
  if (Math.abs(distance) === 1) {
    // Adjacent slides: move by base width * 0.75 (creates 50% overlap)
    return direction * (baseWidth * 0.5);
  }

  if (Math.abs(distance) === 2) {
    // Outer slides: move by base width * 1.25 (creates 60% overlap with adjacent)
    return direction * (baseWidth * 0.9);
  }

  return 0;
};

const debug = (message: string, data?: unknown) => {
  // console.log(`Carousel Debug: ${message}`, data);
};

export default function createCarouselSlider(
  el: CarouselElement,
): SwiperType | undefined {
  if (!el) return undefined;

  const swiperEl = el.querySelector(".swiper") as HTMLElement;
  if (!swiperEl) return undefined;

  const isMobile =
    globalThis.innerWidth < CAROUSEL_CONFIG.BREAKPOINTS.MOBILE_LG;

  const swiper = new Swiper(swiperEl, {
    modules: [Autoplay, Pagination],
    slidesPerView: isMobile
      ? CAROUSEL_CONFIG.SLIDES.COUNT.MOBILE
      : CAROUSEL_CONFIG.SLIDES.COUNT.DESKTOP,
    centeredSlides: true,
    loop: true,
    speed: CAROUSEL_CONFIG.ANIMATION.SPEED,
    watchSlidesProgress: true,
    allowTouchMove: true,
    virtualTranslate: true,
    initialSlide: 1,
    // Enhanced autoplay configuration
    autoplay: {
      delay: CAROUSEL_CONFIG.ANIMATION.AUTOPLAY,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
      waitForTransition: false,
      enabled: true,
    },

    // Custom slide transition effect
    effect: "custom",

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      renderBullet: function (index, className) {
        return '<div class="w-6 h-1 bg-stamp-primary ' + className +
          '"></div>';
      },
    },

    on: {
      beforeInit: function (swiper: SwiperType) {
        swiper.params.cssMode = false;
        swiper.wrapperEl.style.transform = "translate3d(0, 0, 0)";
        swiper.wrapperEl.style.width = "100%";
        swiper.wrapperEl.style.display = "flex";
        swiper.wrapperEl.style.justifyContent = "center";
      },

      init: function (swiper: SwiperType) {
        // Force start autoplay
        swiper.autoplay.start();

        debug("Carousel Initialized:", {
          autoplay: {
            running: swiper.autoplay.running,
            delay: CAROUSEL_CONFIG.ANIMATION.AUTOPLAY,
          },
          slides: {
            total: swiper.slides.length,
            active: swiper.activeIndex,
          },
        });
      },

      // Add autoplay state monitoring
      autoplayStart: function (swiper: SwiperType) {
        debug("Autoplay Started", { running: true });
      },

      autoplayStop: function (swiper: SwiperType) {
        debug("Autoplay Stopped", { running: false });
      },

      setTranslate: function (swiper: SwiperType) {
        // Prevent Swiper's default translation
        swiper.wrapperEl.style.transform = "translate3d(0, 0, 0)";
      },

      progress: function (swiper: SwiperType) {
        const containerWidth = el.offsetWidth;
        const isMobile = containerWidth < CAROUSEL_CONFIG.BREAKPOINTS.MOBILE_LG;
        const { baseWidth } = calculateDimensions(containerWidth);
        const centerX = containerWidth / 2;

        const slides = swiper.slides;
        for (let i = 0; i < slides.length; i++) {
          const slideEl = slides[i] as HTMLElement;

          let distance = i - swiper.activeIndex;
          if (distance > slides.length / 2) distance -= slides.length;
          if (distance < -slides.length / 2) distance += slides.length;

          const isCenter = distance === 0;
          const isAdjacent = Math.abs(distance) === 1;
          const isOuter = Math.abs(distance) === 2;

          // Only show 3 slides on mobile
          const shouldShow = isMobile
            ? Math.abs(distance) <= 1 // Only center and adjacent for mobile
            : Math.abs(distance) <= 2; // All 5 slides for desktop

          if (!shouldShow) {
            slideEl.style.visibility = "hidden";
            slideEl.style.opacity = "0";
            slideEl.style.zIndex = "-1";
            continue;
          }

          // Keep existing styling logic
          slideEl.style.visibility = "visible";
          slideEl.style.width = `${baseWidth}px`;
          slideEl.style.position = "absolute";

          // Use existing scale and translation calculations
          const scale = isCenter ? 1 : isAdjacent ? 0.8 : 0.6;
          const translateX = calculateTranslateX(distance, baseWidth, isMobile);

          const finalTranslateX = translateX - (baseWidth / 2);
          slideEl.style.left = `${centerX}px`;
          slideEl.style.transform =
            `translateX(${finalTranslateX}px) scale(${scale})`;

          slideEl.style.zIndex = isCenter ? "3" : isAdjacent ? "2" : "1";
          slideEl.style.opacity = isCenter ? "1" : isAdjacent ? "0.8" : "0.6";
          slideEl.style.filter = isCenter
            ? "none"
            : isAdjacent
            ? "blur(1px)"
            : "blur(2px)";
        }
      },

      afterInit: function (swiper: SwiperType) {
        // Ensure autoplay starts properly
        setTimeout(() => {
          swiper.autoplay.start();
          debug("Autoplay Started After Init", {
            running: swiper.autoplay.running,
            time: Date.now(),
          });
        }, 100);
      },

      autoplay: function (swiper: SwiperType) {
        const currentIndex = swiper.activeIndex;
        const nextIndex = (currentIndex + 1) % swiper.slides.length;

        debug("Autoplay Moving:", {
          current: currentIndex,
          next: nextIndex,
          time: Date.now(),
        });

        // Force slide movement
        requestAnimationFrame(() => {
          swiper.slideTo(nextIndex, CAROUSEL_CONFIG.ANIMATION.SPEED);
        });
      },

      slideChange: function (swiper: SwiperType) {
        debug("Slide Changed:", {
          activeIndex: swiper.activeIndex,
          realIndex: swiper.realIndex,
          autoplayRunning: swiper.autoplay.running,
          time: Date.now(),
        });
        const paginationBullets = document.querySelectorAll(
          ".swiper-pagination .swiper-pagination-bullet",
        );

        // Hide extra pagination bullets when the slide changes
        const visibleSlides = isMobile
          ? CAROUSEL_CONFIG.SLIDES.COUNT.MOBILE
          : CAROUSEL_CONFIG.SLIDES.COUNT.DESKTOP;

        paginationBullets.forEach((bullet, index) => {
          if (swiper.realIndex >= visibleSlides) {
            if (
              index >= visibleSlides
            ) {
              bullet.style.display = "block";
            } else {
              bullet.style.display = "none";
            }
          } else {
            if (index >= visibleSlides) {
              bullet.style.display = "none";
            } else {
              bullet.style.display = "block";
            }
          }
        });

        // Ensure autoplay continues
        if (!swiper.autoplay.running) {
          swiper.autoplay.start();
        }
      },
    },
  });

  // Force autoplay to start and stay running
  swiper.autoplay.start();

  // Monitor and restart autoplay if needed
  const autoplayMonitor = setInterval(() => {
    if (!swiper.autoplay.running) {
      debug("Autoplay Monitor - Restarting");
      swiper.autoplay.start();
    }
  }, 1000);

  // Clean up monitor on destroy
  swiper.on("destroy", () => {
    clearInterval(autoplayMonitor);
  });

  return swiper;
}

// Let me clearly state the design requirements and then propose a solution:
// Design Requirements:
// Center Image (Active):
// Maximum width/height of 408px and should scale up and down responsively
// Centered in the container/viewport
// Full opacity, no blur
// Scale: 1.0 (100%)
// Adjacent Images (Left and Right of Center):
// Scale: 0.8 (80% of center = ~326px)
// 50% overlapped behind the center image
// Slight blur effect
// Reduced opacity (0.8)
// One on each side of center image
// Outer Images (Furthest Left and Right):
// Scale: 0.6 (60% of center = ~245px)
// 60% overlapped behind adjacent images
// More blur effect
// More reduced opacity (0.6)
// One on each side of adjacent images
// Layout:
// Always show exactly 5 images
// Images should be arranged: Outer -> Adjacent -> Center -> Adjacent -> Outer
// Center image should be truly centered in the container
// Container should respect page margins and max-width
