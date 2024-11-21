import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { StampRow } from "globals";
import createCarouselSlider from "$client/utils/carousel-slider.ts";

interface CarouselProps {
  stamps: StampRow[];
  automatic?: boolean;
  showNavigation?: boolean;
  class?: string;
}

export default function Carousel(props: CarouselProps) {
  const duplicatedStamps = [...props.stamps, ...props.stamps, ...props.stamps];

  useEffect(() => {
    if (IS_BROWSER) {
      const carouselElement = document.querySelector(
        ".carousel-slider",
      ) as HTMLElement;
      createCarouselSlider(carouselElement);
    }
  }, []);

  if (!IS_BROWSER) {
    return <div>Loading carousel...</div>;
  }

  return (
    <div
      class={`carousel-slider relative h-[450px] w-full ${props.class ?? ""}`}
    >
      <div class="swiper h-full">
        <div class="swiper-wrapper">
          {duplicatedStamps.map((stamp, index) => {
            const extension = stamp.stamp_url?.split(".")?.pop() || "";
            return (
              <div
                class="swiper-slide"
                key={`${stamp.tx_hash}-${index}`}
                data-hash={stamp.tx_hash}
              >
                <img
                  src={`/content/${stamp.tx_hash}.${extension}`}
                  alt={`Stamp #${stamp.stamp}`}
                  loading="lazy"
                  class="rounded-xl object-contain cursor-pointer border-2 border-transparent hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid"
                />
              </div>
            );
          })}
        </div>
        <div
          class="swiper-pagination"
          data-slides-length={props.stamps.length}
        >
        </div>
      </div>
    </div>
  );
}
