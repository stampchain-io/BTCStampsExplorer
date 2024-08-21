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
        <div
          key={index}
          class={`absolute w-full h-full transition-opacity duration-500 ${
            index === currentSlide.value ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.url}
            alt={slide.alt}
            class="w-full h-full object-cover"
          />
        </div>
      ))}
      {SHOW_NAVIGATION && (
        <>
          <button
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
          </button>
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {SLIDE_DATA.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                class={`w-3 h-3 rounded-full ${
                  index === currentSlide.value ? "bg-white" : "bg-gray-400"
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
