import { useEffect, useRef } from "preact/hooks";
import createCarouselSlider from "$client/utils/carousel-slider.ts";
import { StampRow } from "globals";
import { getFileSuffixFromMime } from "$lib/utils/util.ts";

interface CarouselProps {
  stamps: StampRow[];
}

export default function Carousel({ stamps }: CarouselProps) {
  const swiperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (swiperRef.current) {
      createCarouselSlider(swiperRef.current);
    }
  }, []);

  return (
    <div
      class={`
        w-[90%]
        mobileSm:w-[90%]
        mobileLg:w-[85%]
        tablet:w-[80%]
        desktop:w-[80%]
        mx-auto
      `}
    >
      <div className="carousel-slider" ref={swiperRef}>
        <div className="swiper">
          <div className="swiper-wrapper">
            {stamps.map((stamp: StampRow) => (
              <div className="swiper-slide" key={stamp.tx_hash}>
                <div className="relative w-full h-full">
                  <div className="relative aspect-stamp w-full h-full overflow-hidden image-rendering-pixelated rounded-stamp border-2 border-transparent hover:border-stamp-purple-bright hover:shadow-stamp">
                    <div className="absolute inset-0 bg-stamp-card-bg rounded-stamp" />
                    <img
                      className="relative z-10 w-full h-full object-contain pixelart"
                      src={`/content/${stamp.tx_hash}.${
                        getFileSuffixFromMime(stamp.stamp_mimetype)
                      }`}
                      alt={`Stamp #${stamp.stamp}`}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            class={`
              swiper-pagination
              hidden tablet:block
              pt-[36px]
            `}
          >
          </div>
        </div>
      </div>
    </div>
  );
}
