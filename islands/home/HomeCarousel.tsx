import Carousel from "$islands/Carousel.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";

export const HomeCarousel = () => {
  if (!IS_BROWSER) {
    return <div>Loading carousel...</div>;
  } else {
    return <Carousel />;
  }
};
