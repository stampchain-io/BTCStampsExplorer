import { IS_BROWSER } from "$fresh/runtime.ts";
import Carousel from "../Carousel.tsx";

export const HomeCarousel = () => {
  return (
    <div class="w-full h-[300px] md:h-[520px]">
      {IS_BROWSER
        ? (
          <Carousel
            showNavigation={true}
            automatic={true}
            interval={5000}
            class="h-full"
          />
        )
        : <div>Loading carousel...</div>}
    </div>
  );
};
