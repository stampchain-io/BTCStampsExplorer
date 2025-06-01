/* ===== CAROUSEL GALLERY COMPONENT ===== */
/* TODO (@baba)-update styling */
import { useEffect, useMemo, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { StampRow } from "$globals";
import { ComponentChildren } from "preact";
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

// Cache for validation results to prevent re-validation
const validationCache = new Map<string, boolean>();

/* ===== COMPONENT ===== */
export default function CarouselGallery(props: CarouselProps) {
  /* ===== PROPS EXTRACTION ===== */
  const { stamps } = props;

  /* ===== COMPUTED VALUES ===== */
  const isMobile = globalThis.innerWidth < 768;

  // Memoize duplicatedStamps to prevent infinite re-renders
  // For Swiper loop mode, we need enough slides: minimum 2x slidesPerView
  const duplicatedStamps = useMemo(() => {
    if (stamps.length === 0) return [];

    // Mobile needs 3 slides per view, desktop needs 5
    const minSlidesNeeded = isMobile ? 6 : 10; // 2x slidesPerView for proper loop

    // If we have enough stamps, just duplicate them
    if (stamps.length >= (isMobile ? 3 : 5)) {
      return [...stamps, ...stamps];
    }

    // If we don't have enough stamps, repeat them until we have enough
    const result = [...stamps];
    while (result.length < minSlidesNeeded) {
      result.push(...stamps);
    }

    return result;
  }, [stamps, isMobile]);

  /* ===== STATE ===== */
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [validatedContent, setValidatedContent] = useState<
    Record<string, ComponentChildren>
  >({});

  /* ===== EVENT HANDLERS ===== */
  const handleLoad = () => {
    setLoading(false);
  };

  /* ===== VALIDATION EFFECT ===== */
  useEffect(() => {
    const validateStamps = async () => {
      const validated: Record<string, ComponentChildren> = {};

      for (const stamp of duplicatedStamps) {
        // Skip if already validated
        if (validatedContent[stamp.tx_hash]) {
          continue;
        }

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

        // Handle SVG content with caching
        if (stamp.stamp_mimetype === "image/svg+xml") {
          const svgSrc = `/content/${stamp.tx_hash}.svg`;

          // Check cache first
          let isValid = validationCache.get(svgSrc);

          if (isValid === undefined) {
            // Only validate if not in cache
            const validationResult = await validateStampContent(svgSrc);
            isValid = validationResult.isValid;
            validationCache.set(svgSrc, isValid);
          }

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

      // Only update state if we have new validated content
      if (Object.keys(validated).length > 0) {
        setValidatedContent((prev) => ({ ...prev, ...validated }));
      }
    };

    validateStamps();
  }, [duplicatedStamps]); // Now properly memoized

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
