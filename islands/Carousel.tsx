import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
// import IconCircleChevronsRight from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-right.tsx";
// import IconCircleChevronsLeft from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-left.tsx";

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
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "http://dev.bitcoinstamps.xyz/img/home/carousel2.png",
    alt: "Slide 2",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "http://dev.bitcoinstamps.xyz/img/home/carousel3.png",
    alt: "Slide 3",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
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
      {SLIDE_DATA.map((slide, index) => {
        return (
          (
            <div
              className={`flex-col md:flex-row gap-4 md:gap-16 2xl:gap-32 justify-center items-center transition-all duration-500 ${
                index === currentSlide.value
                  ? "flex opacity-100"
                  : "hidden opacity-0"
              }`}
            >
              <img
                key={index}
                src={slide.url}
                alt={slide.alt}
                class={`origin-center h-auto object-content max-w-[400px] md:w-1/2 z-10`}
              />
              <div className={"text-center md:text-left md:w-1/2"}>
                <p
                  className={"bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black text-4xl md:text-5xl 2xl:text-7xl"}
                >
                  {slide.title}
                </p>
                <p
                  className={"font-semibold text-xl md:text-2xl 2xl:text-4xl text-[#FF00E9]"}
                >
                  {slide.subTitle}
                </p>
                <p
                  className={"font-medium text-xl md:text-2xl 2xl:text-4xl text-[#DBDBDB]"}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          )
        );
      })}
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
