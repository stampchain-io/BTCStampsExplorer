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

const calculateDimensions = (containerWidth: number) => {
  const baseWidth = Math.min(
    CAROUSEL_CONFIG.SLIDES.MAX_WIDTH,
    containerWidth * CAROUSEL_CONFIG.SLIDES.CONTAINER_WIDTH_RATIO,
  );

  const adjacentWidth = baseWidth * CAROUSEL_CONFIG.SCALE.ADJACENT;
  const outerWidth = baseWidth * CAROUSEL_CONFIG.SCALE.OUTER;

  const adjacentVisible = adjacentWidth *
    (1 - CAROUSEL_CONFIG.OVERLAP.ADJACENT);
  const outerVisible = outerWidth * (1 - CAROUSEL_CONFIG.OVERLAP.OUTER);

  const totalWidth = baseWidth +
    (2 * adjacentVisible) +
    (2 * outerVisible);
  const centerOffset = (containerWidth - totalWidth) / 2;

  const adjacentTranslate = baseWidth * 0.5;
  const outerTranslate = baseWidth * 0.5 + adjacentWidth * 0.5;

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

  if (Math.abs(distance) === 1) {
    return direction * (baseWidth * 0.5);
  }

  if (Math.abs(distance) === 2) {
    return direction * (baseWidth * 0.9);
  }

  return 0;
};

const debug = (message: string, data?: unknown) => {
  if (CAROUSEL_CONFIG.DEBUG.ENABLED) {
    console.log(`Carousel Debug: ${message}`, data);
  }
};

const calculateTransforms = (
  swiper: SwiperType,
  containerWidth: number,
  isMobile: boolean,
  baseWidth: number,
  centerX: number,
) => {
  return swiper.slides.map((slideEl, i) => {
    let distance = i - swiper.activeIndex;
    if (distance > swiper.slides.length / 2) distance -= swiper.slides.length;
    if (distance < -swiper.slides.length / 2) distance += swiper.slides.length;

    const isCenter = distance === 0;
    const isAdjacent = Math.abs(distance) === 1;
    const shouldShow = isMobile
      ? Math.abs(distance) <= 1
      : Math.abs(distance) <= 2;

    const scale = isCenter
      ? CAROUSEL_CONFIG.SCALE.CENTER
      : isAdjacent
      ? CAROUSEL_CONFIG.SCALE.ADJACENT
      : CAROUSEL_CONFIG.SCALE.OUTER;

    const translateX = calculateTranslateX(distance, baseWidth, isMobile);
    const finalTranslateX = translateX - (baseWidth / 2);

    return {
      el: slideEl,
      transform: {
        visibility: shouldShow ? "visible" : "hidden",
        width: `${baseWidth}px`,
        position: "absolute",
        left: `${centerX}px`,
        transform: `translateX(${finalTranslateX}px) scale(${scale})`,
        zIndex: isCenter ? "3" : isAdjacent ? "2" : "1",
        opacity: isCenter
          ? CAROUSEL_CONFIG.EFFECTS.OPACITY.CENTER
          : isAdjacent
          ? CAROUSEL_CONFIG.EFFECTS.OPACITY.ADJACENT
          : CAROUSEL_CONFIG.EFFECTS.OPACITY.OUTER,
        filter: isCenter
          ? "none"
          : `blur(${
            isAdjacent
              ? CAROUSEL_CONFIG.EFFECTS.BLUR.ADJACENT
              : CAROUSEL_CONFIG.EFFECTS.BLUR.OUTER
          }px)`,
      },
    };
  });
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
    autoplay: {
      delay: CAROUSEL_CONFIG.ANIMATION.AUTOPLAY,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
      waitForTransition: false,
      enabled: true,
    },

    effect: "custom",

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      renderBullet: function (_index, className) {
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

      autoplayStart: function (_swiper: SwiperType) {
        debug("Autoplay Started", { running: true });
      },

      autoplayStop: function (_swiper: SwiperType) {
        debug("Autoplay Stopped", { running: false });
      },

      setTranslate: function (swiper: SwiperType) {
        swiper.wrapperEl.style.transform = "translate3d(0, 0, 0)";
      },

      progress: function (swiper: SwiperType) {
        const containerWidth = el.offsetWidth;
        const isMobile = containerWidth < CAROUSEL_CONFIG.BREAKPOINTS.MOBILE_LG;
        const { baseWidth } = calculateDimensions(containerWidth);
        const centerX = containerWidth / 2;

        const transforms = calculateTransforms(
          swiper,
          containerWidth,
          isMobile,
          baseWidth,
          centerX,
        );

        requestAnimationFrame(() => {
          transforms.forEach(({ el, transform }) => {
            Object.assign(el.style, transform);
          });
        });
      },

      afterInit: function (swiper: SwiperType) {
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

        if (!swiper.autoplay.running) {
          swiper.autoplay.start();
        }
      },
    },
  });

  swiper.autoplay.start();

  const autoplayMonitor = setInterval(() => {
    if (!swiper.autoplay.running) {
      debug("Autoplay Monitor - Restarting");
      swiper.autoplay.start();
    }
  }, 1000);

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
