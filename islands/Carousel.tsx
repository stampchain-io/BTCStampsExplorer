import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { StampRow } from "globals";
import createCarouselSlider from "$client/utils/carousel-slider.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

interface CarouselProps {
  stamps: StampRow[];
  automatic?: boolean;
  showNavigation?: boolean;
  class?: string;
}

export default function Carousel(props: CarouselProps) {
  const duplicatedStamps = [...props.stamps];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  const handleLoad = () => {
    setLoading(false);
  };

  useEffect(() => {
    if (IS_BROWSER) {
      const carouselElement = document.querySelector(
        ".carousel-slider",
      ) as HTMLElement;
      const swiper = createCarouselSlider(carouselElement);
      // Add event listener to update active index
      swiper?.on("slideChange", () => {
        setActiveSlideIndex(swiper.realIndex); // Update the active index in state
      });
    }
  }, []);

  if (!IS_BROWSER && loading) {
    return <div>Loading carousel...</div>;
  }

  return (
    <>
      <div
        class={`carousel-slider relative  mobileSm:h-[186px] mobileMd:h-[302px] mobileLg:h-[260px] tablet:h-[341px] desktop:h-[480px] w-full ${
          props.class ?? ""
        }`}
      >
        <div class="swiper h-full">
          <div class="swiper-wrapper ">
            {duplicatedStamps.map((stamp, index) => {
              const extension = stamp.stamp_url?.split(".")?.pop() || "";
              return (
                <div
                  class="swiper-slide group h-full"
                  key={`${stamp.tx_hash}-${index}`}
                  data-hash={stamp.tx_hash}
                >
                  <a target="_top" href={`/stamp/${stamp.tx_hash}`}>
                    <div className="hover-gradient hover:bg-stamp-purple-bright hover:shadow-stamp p-0.5 rounded-xl">
                      <div className="mobileLg:p-[12px] p-[6px] rounded-xl bg-stamp-card-bg hover:bg-black relative  desktop:min-h-[408px] tablet:min-h-[269px] mobileLg:min-h-[200px] mobileMd:min-h-[242px] min-h-[150px]">
                        <img
                          src={`/content/${stamp.tx_hash}.${extension}`}
                          alt={`Stamp #${stamp.stamp}`}
                          loading="lazy"
                          class="rounded-xl object-contain cursor-pointer desktop:min-w-[408px] tablet:min-w-[269px] mobileLg:min-w-[200px] mobileMd:min-w-[242px] min-w-[150px]"
                          onLoad={handleLoad}
                        />
                        {activeSlideIndex - 1 == index &&
                          (
                            <div
                              id="hover"
                              className="mobileLg:w-calc-24 w-calc-12 h-[160px] hover-dark-gradient absolute bottom-[2%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
                            >
                              <div className="w-full mobileLg:pb-4 pb-1">
                                <div className="w-full flex justify-center items-center">
                                  <h3 className="desktop:text-4xl mobileLg:text-2xl text-xl text-stamp-primary font-extrabold">
                                    <span className="font-light">#</span>
                                    <span className="font-black">
                                      {stamp.stamp}
                                    </span>
                                  </h3>
                                </div>
                                <div className="w-full px-4 py-1 flex justify-between items-center">
                                  <h4 className="desktop:text-2xl mobileLg:text-lg text-base text-stamp-grey font-bold mobileMd:text-start text-center w-full">
                                    {stamp.creator_name
                                      ? stamp.creator_name
                                      : abbreviateAddress(stamp.creator, 4)}
                                  </h4>
                                  <h5 className="desktop:text-xl mobileLg:text-base text-sm text-stamp-grey-darker font-bold mobileMd:block text-end w-full hidden">
                                    {stamp.divisible
                                      ? (stamp.supply / 100000000).toFixed(2)
                                      : stamp.supply > 100000
                                      ? "+100000"
                                      : stamp.supply}
                                  </h5>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
        <div
          class="swiper-pagination"
          data-slides-length={props.stamps.length}
        >
        </div>
      </div>
    </>
  );
}
