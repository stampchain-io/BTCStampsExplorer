/* ===== CAROUSEL GALLERY COMPONENT ===== */
/* TODO (@baba)-update styling */
import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { StampRow } from "$globals";
import createCarouselSlider from "$client/utils/carousel-slider.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import {
  getStampImageSrc,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";
import { ERROR_IMAGE } from "$lib/utils/constants.ts";

/* ===== TYPES ===== */
interface CarouselProps {
  stamps: StampRow[];
  automatic?: boolean;
  showNavigation?: boolean;
  class?: string;
}

/* ===== COMPONENT ===== */
export default function CarouselGallery(props: CarouselProps) {
  /* ===== PROPS EXTRACTION ===== */
  const { stamps } = props;

  /* ===== COMPUTED VALUES ===== */
  const isMobile = globalThis.innerWidth < 768;
  const duplicatedStamps = isMobile
    ? [...stamps, ...[stamps[2]]]
    : [...stamps, ...stamps];

  /* ===== STATE ===== */
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [validatedContent, setValidatedContent] = useState<
    Record<string, JSX.Element>
  >({});

  /* ===== EVENT HANDLERS ===== */
  const handleLoad = () => {
    setLoading(false);
  };

  /* ===== VALIDATION EFFECT ===== */
  useEffect(() => {
    const validateStamps = async () => {
      const validated: Record<string, JSX.Element> = {};

      for (const stamp of duplicatedStamps) {
        // Get proper stamp URL using getStampImageSrc
        const src = await getStampImageSrc(stamp);

        // Handle HTML content
        if (stamp.stamp_mimetype === "text/html") {
          validated[stamp.tx_hash] = (
            <a target="_top" href={`/stamp/${stamp.tx_hash}`}>
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                className="object-contain cursor-pointer desktop:min-w-[408px] tablet:min-w-[269px] mobileLg:min-w-[200px] mobileMd:min-w-[242px] min-w-[150px] rounded aspect-square"
                sandbox="allow-scripts allow-same-origin"
                src={src}
                loading="lazy"
                onLoad={handleLoad}
              />
            </a>
          );
          continue;
        }

        // Handle SVG content
        if (stamp.stamp_mimetype === "image/svg+xml") {
          const { isValid } = await validateStampContent(
            `/content/${stamp.tx_hash}.svg`,
          );
          if (!isValid) {
            validated[stamp.tx_hash] = (
              <a target="_top" href={`/stamp/${stamp.tx_hash}`}>
                <img
                  src={ERROR_IMAGE}
                  alt="Invalid SVG"
                  className="object-contain cursor-pointer desktop:min-w-[408px] tablet:min-w-[269px] mobileLg:min-w-[200px] mobileMd:min-w-[242px] min-w-[150px] rounded pixelart"
                  onLoad={handleLoad}
                />
              </a>
            );
          }
        }
      }
      setValidatedContent(validated);
    };

    validateStamps();
  }, [duplicatedStamps]);

  /* ===== CAROUSEL EFFECT ===== */
  useEffect(() => {
    if (IS_BROWSER) {
      const carouselElement = document.querySelector(
        ".carousel-slider",
      ) as HTMLElement;
      const swiper = createCarouselSlider(carouselElement);
      swiper?.on("slideChange", () => {
        setActiveSlideIndex(swiper.realIndex);
      });
    }
  }, []);

  /* ===== LOADING STATE ===== */
  if (!IS_BROWSER && loading) {
    return <div>Loading carousel...</div>;
  }

  /* ===== RENDER ===== */
  return (
    <>
      <div class={`carousel-slider ${props.class ?? ""}`}>
        <div class="swiper h-full">
          <div class="swiper-wrapper">
            {duplicatedStamps.map((stamp, index) => {
              const extension = stamp.stamp_url?.split(".")?.pop() || "";
              return (
                <div
                  class="swiper-slide group h-full"
                  key={`${stamp.tx_hash}-${index}`}
                  data-hash={stamp.tx_hash}
                >
                  <a target="_top" href={`/stamp/${stamp.tx_hash}`}>
                    <div className="hover-gradient hover:bg-stamp-purple-bright hover:shadow-stamp p-0.5 rounded-md">
                      <div className="relative min-h-[150px] mobileMd:min-h-[242px] mobileLg:min-h-[200px] tablet:min-h-[269px] desktop:min-h-[408px] p-[6px] mobileMd:p-[12px] desktop:p-[18px] rounded-md bg-stamp-card-bg hover:bg-black">
                        {validatedContent[stamp.tx_hash] || (
                          <img
                            src={`/content/${stamp.tx_hash}.${extension}`}
                            alt={`Stamp #${stamp.stamp}`}
                            loading="lazy"
                            class="object-contain cursor-pointer desktop:min-w-[408px] tablet:min-w-[269px] mobileLg:min-w-[200px] mobileMd:min-w-[242px] min-w-[150px] rounded"
                            onLoad={handleLoad}
                          />
                        )}
                        {/* ===== HOVER OVERLAY ===== */}
                        {activeSlideIndex - 1 == index && (
                          <div
                            id="hover"
                            className="flex items-end mobileLg:w-calc-24 w-calc-12 h-[100%] hover-dark-gradient absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <div className="w-full pb-1">
                              <div className="desktop:hidden flex justify-center items-center w-full">
                                <h3 className="font-black text-lg gray-gradient1 text-center">
                                  <span className="font-light text-stamp-grey-light">
                                    #
                                  </span>
                                  {stamp.stamp}
                                </h3>
                              </div>
                              <div className="hidden mobileLg:flex justify-between items-end w-full flex-1 px-1 desktop:px-3 pb-1.5 desktop:pb-2">
                                <h3 className="hidden desktop:block font-black text-2xl gray-gradient1 desktop:text-left">
                                  <span className="font-light text-stamp-grey-light">
                                    #
                                  </span>
                                  {stamp.stamp}
                                </h3>
                                <h4 className="font-medium text-sm desktop:text-base gray-gradient3 text-left desktop:text-center tracking-normal mb-0.5">
                                  {stamp.creator_name
                                    ? stamp.creator_name
                                    : abbreviateAddress(stamp.creator, 8)}
                                </h4>
                                <h5 className="font-bold text-base desktop:text-lg text-[#BBBBBB] text-right">
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
        {/* ===== PAGINATION ===== */}
        <div
          class="swiper-pagination"
          data-slides-length={props.stamps.length}
        >
        </div>
      </div>
    </>
  );
}
