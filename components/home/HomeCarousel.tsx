import Carousel from "$islands/Carousel.tsx";
import type { StampRow } from "$types/utils.d.ts";
import SwiperStyles from "$islands/home/SwiperStyles.tsx";

interface HomeCarouselProps {
  carouselStamps: StampRow[];
}

export function HomeCarousel({ carouselStamps }: HomeCarouselProps) {
  if (!carouselStamps?.length) {
    return null; // Or a loading state
  }

  return (
    <>
      <SwiperStyles />
      <div class="max-w-desktop w-full mx-auto p-3 tablet:p-6 desktop:p-12">
        <div class="
          w-full
          max-w-[500px] h-[260px]
          mobileMd:max-w-[500px] mobileMd:h-[360px]
          mobileLg:max-w-[640px] mobileLg:h-[320px]
          tablet:max-w-[840px] tablet:h-[400px]
          desktop:max-w-[1246px] desktop:h-[540px]
          mx-auto
          relative
          overflow-visible
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
    </>
  );
}
