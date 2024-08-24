import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import IconCircleChevronsRight from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-right.tsx";
import IconCircleChevronsLeft from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-left.tsx";

interface CarouselProps {
  showNavigation?: boolean;
  automatic?: boolean;
  interval?: number;
  class?: string;
}

const SLIDE_DATA = [
  {
    url: "http://dev.bitcoinstamps.xyz/img/home/carousel1.png",
    alt: "Slide 1",
  },
  {
    url: "http://dev.bitcoinstamps.xyz/img/home/carousel2.png",
    alt: "Slide 2",
  },
  {
    url: "http://dev.bitcoinstamps.xyz/img/home/carousel3.png",
    alt: "Slide 3",
  },
];

const Carousel = (props: CarouselProps) => {
  const currentSlide = useSignal(0);
  const automatic = useSignal(props.automatic ?? false);
  const SLIDE_INTERVAL = props.interval ?? 5000;
  const SHOW_NAVIGATION = props.showNavigation ?? true;

  const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % SLIDE_DATA.length;
  };

  const previousSlide = () => {
    currentSlide.value = (currentSlide.value - 1 + SLIDE_DATA.length) %
      SLIDE_DATA.length;
  };

  const goToSlide = (index: number) => {
    if (automatic.value) automatic.value = false;
    currentSlide.value = index;
  };

  useEffect(() => {
    if (IS_BROWSER && automatic.value) {
      const interval = setInterval(nextSlide, SLIDE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [automatic.value]);

  if (!IS_BROWSER) {
    return <div>Loading carousel...</div>;
  }

  return (
    <div class={`relative overflow-hidden ${props.class ?? ""}`}>
      {SLIDE_DATA.map((slide, index) => (
        <img
          key={index}
          src={slide.url}
          alt={slide.alt}
          class={`absolute transition-transform duration-500 h-auto object-fit ${
            index === currentSlide.value
              ? "left-1/2 -translate-x-1/2 w-[calc(30%+200px)] z-10"
              : (index === (currentSlide.value - 1 + SLIDE_DATA.length) %
                  SLIDE_DATA.length
                ? "left-[16.67%] -translate-x-1/2 top-[100px] w-1/3 z-0"
                : "left-[83.33%] -translate-x-1/2 top-[100px] w-1/3 z-0")
          }`}
        />
      ))}
      {SHOW_NAVIGATION && (
        <>
          {
            /* <button
            onClick={previousSlide}
            class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
          >
            <IconCircleChevronsLeft />
          </button>
          <button
            onClick={nextSlide}
            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
          >
            <IconCircleChevronsRight />
          </button> */
          }
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-[19]">
            {SLIDE_DATA.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                class={`w-[44px] md:w-[88px] h-0 border-2 rounded-[4px] ${
                  index === currentSlide.value
                    ? "border-[#7A00F5]"
                    : "border-[#3F2A4E]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;
