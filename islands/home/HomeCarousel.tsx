import { IS_BROWSER } from "$fresh/runtime.ts";
import Carousel from "../Carousel.tsx";

export const HomeCarousel = () => {
  return (
    <>
      {IS_BROWSER
        ? (
          <Carousel
            showNavigation={true}
            automatic={true}
            interval={5000}
            class="w-full h-[min(calc(30vw+220px),650px)]"
          />
        )
        : <div>Loading carousel...</div>}
    </>
  );
};
