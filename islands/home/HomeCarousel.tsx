import Carousel from "$islands/Carousel.tsx";
import { StampRow } from "globals";

interface HomeCarouselProps {
  carouselStamps: StampRow[];
}

export function HomeCarousel({ carouselStamps }: HomeCarouselProps) {
  return (
    <div class="max-w-desktop w-full mx-auto px-3 tablet:px-6 desktop:px-12">
      <div class="
        w-full
        mobileSm:max-w-[310px]
        mobileLg:max-w-[515px]
        tablet:max-w-[618px]
        desktop:max-w-[772px]
        mx-auto
        relative
        overflow-hidden
        flex
        justify-center
        items-center
      ">
        <Carousel
          stamps={carouselStamps}
          class="carousel-container"
        />
      </div>
    </div>
  );
}
