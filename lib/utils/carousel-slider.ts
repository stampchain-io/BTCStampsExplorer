import Swiper, { Swiper as SwiperType } from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

// Define the type for the element
type CarouselElement = HTMLElement | null;

export default function createCarouselSlider(
  el: CarouselElement,
): SwiperType | undefined {
  if (!el) return undefined; // Handle potential null

  // main swiper element
  const swiperEl = el.querySelector(".swiper") as HTMLElement;

  if (!swiperEl) return undefined; // Handle case where swiperEl is not found

  // init main swiper
  const swiper = new Swiper(swiperEl, {
    modules: [Autoplay, Navigation, Pagination],
    grabCursor: true,
    watchSlidesProgress: true,
    loop: true,
    loopedSlides: 5,
    loopAdditionalSlides: 5,
    slidesPerView: "auto",
    centeredSlides: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      renderBullet: function (index, className) {
        return '<button class="w-[44px] md:w-[88px] h-0 border-2 rounded-[4px] ' +
          className + '"/>';
      },
    },
    autoplay: {
      delay: 3000,
    },
    on: {
      progress(swiper: SwiperType) {
        const scaleStep = 0.2;
        const zIndexMax = swiper.slides.length;

        for (let i = 0; i < swiper.slides.length; i += 1) {
          const slideEl = swiper.slides[i] as HTMLElement;
          const slideProgress = swiper.slides[i].progress;
          const absProgress = Math.abs(slideProgress);
          let modify = 1;

          if (absProgress > 1) {
            modify = (absProgress - 1) * 0.3 + 1;
          }

          const opacityEls = slideEl.querySelectorAll(
            ".carousel-slider-animate-opacity",
          ) as NodeListOf<HTMLElement>;
          const translate = `${slideProgress * modify * 50}%`;
          const scale = 1 - absProgress * scaleStep;
          const zIndex = zIndexMax - Math.abs(Math.round(slideProgress));

          slideEl.style.transform = `translateX(${translate}) scale(${scale})`;
          slideEl.style.zIndex = zIndex;

          if (absProgress > 3) {
            slideEl.style.opacity = "0";
          } else {
            slideEl.style.opacity = "1";
          }

          opacityEls.forEach((opacityEl) => {
            opacityEl.style.opacity = `${1 - absProgress / 3}`;
          });
        }
      },
      setTransition(swiper: SwiperType, duration: number) {
        for (let i = 0; i < swiper.slides.length; i += 1) {
          const slideEl = swiper.slides[i] as HTMLElement;
          const opacityEls = slideEl.querySelectorAll(
            ".carousel-slider-animate-opacity",
          ) as NodeListOf<HTMLElement>;
          slideEl.style.transitionDuration = `${duration}ms`;

          opacityEls.forEach((opacityEl) => {
            opacityEl.style.transitionDuration = `${duration}ms`;
          });
        }
      },
    },
  });

  return swiper;
}
