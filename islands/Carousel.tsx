import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import IconCircleChevronsRight from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-right.tsx";
import IconCircleChevronsLeft from "https://deno.land/x/tabler_icons_tsx@0.0.3/tsx/circle-chevrons-left.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";

const SLIDE_DATA = [
  { url: "img/home/carousel1.png", alt: "snowy deno" },
  { url: "img/home/carousel2.png", alt: "deno world is raining" },
  { url: "img/home/carousel3.png", alt: "deno news" },
  { url: "img/home/carousel2.png", alt: "deno city" },
];

const Slide = (
  props: { index: number; data: { url: string; alt: string }; class?: string },
) => {
  return (
    <img
      src={props.data.url}
      alt={props.data.alt}
      class={`slide absolute top-0 left-0 transition-all ease-in-out duration-700 transform ${props.class}`}
      style="background-color: white; border: 1px solid red;" // Add this line
    />
  );
};

const Carousel = (
  props: {
    showNavigation?: boolean;
    automatic?: boolean;
    interval?: number;
    class?: string;
  },
) => {
  const NAVIGATION_COLOR = `text-white`;
  const CHEVRON_STYLE =
    `absolute z-30 w-10 h-10 hover:text-grey ${NAVIGATION_COLOR} cursor-pointer`;
  const SHOW_NAVIGATION = props.showNavigation ?? true;
  const SLIDE_INTERVAL = props.interval ?? 3500;
  const currentSlide = useSignal(0);
  const automatic = useSignal(props.automatic ?? true);

  const slideClasses = (idx: number) => {
    let outgoingSlide = currentSlide.value - 1;
    let incomingSlide = currentSlide.value + 1;
    if (outgoingSlide === -1) outgoingSlide = SLIDE_DATA.length - 1;
    if (incomingSlide === SLIDE_DATA.length) incomingSlide = 0;

    if (currentSlide.value === idx) return "translate-x-0 z-20";
    if (incomingSlide === idx) return "translate-x-full z-10";
    if (outgoingSlide === idx) return "-translate-x-full z-10";
    return "translate-x-full";
  };

  const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % SLIDE_DATA.length;
  };

  const previousSlide = () => {
    currentSlide.value = (currentSlide.value - 1 + SLIDE_DATA.length) %
      SLIDE_DATA.length;
  };

  const chevronClick = (doCallback: () => void) => {
    if (automatic.value) automatic.value = false;
    doCallback();
  };

  useEffect(() => {
    if (IS_BROWSER) {
      const interval = setInterval(() => {
        if (automatic.value) nextSlide();
      }, SLIDE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (IS_BROWSER) {
      const keydownHandler = (event: KeyboardEvent) => {
        if (automatic.value) automatic.value = false;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          previousSlide();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          nextSlide();
        }
      };
      document.addEventListener("keydown", keydownHandler);
      return () => document.removeEventListener("keydown", keydownHandler);
    }
  }, []);

  const goToSlide = (slide_index: number) => {
    if (automatic.value) automatic.value = false;
    currentSlide.value = slide_index;
  };

  const DotsNavigation = () => (
    <div
      class={`slide_nav z-30 w-full ${NAVIGATION_COLOR} absolute bottom-0 flex justify-center cursor-pointer`}
    >
      {SLIDE_DATA.map((_item, idx) => (
        <div
          class="px-1 hover:text-grey"
          onClick={() => goToSlide(idx)}
        >
          {idx === currentSlide.value ? "●" : "○"}
        </div>
      ))}
    </div>
  );

  if (!IS_BROWSER) {
    return null; // or a loading placeholder
  }

  return (
    <div
      class={`slideshow relative flex-1 flex-end p-0 overflow-hidden ${
        props.class ?? ""
      }`}
    >
      <IconCircleChevronsLeft
        class={`left-0 ${CHEVRON_STYLE}`}
        style="top: calc(50% - 20px)"
        onClick={() => chevronClick(previousSlide)}
      />
      <IconCircleChevronsRight
        class={`right-0 ${CHEVRON_STYLE}`}
        style="top: calc(50% - 20px)"
        onClick={() => chevronClick(nextSlide)}
      />
      {SLIDE_DATA.map((item, idx) => (
        <Slide
          data={item}
          index={idx}
          class={slideClasses(idx)}
        />
      ))}
      {SHOW_NAVIGATION && <DotsNavigation />}
    </div>
  );
};

export default Carousel;
