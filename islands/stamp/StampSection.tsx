/* ===== STAMP SECTION COMPONENT ===== */
/* TODO (@baba) - move to galleries ??? - update styling and refactor into a base slideshow component*/
import { useEffect, useRef, useState } from "preact/hooks";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { ViewAllButton } from "$buttons";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow, StampSectionProps } from "$globals";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { StampSearchClient } from "$stamp";
import Swiper from "swiper";
import { Autoplay, Navigation } from "swiper/modules";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";
/* ===== COMPONENT ===== */
export default function StampSection({
  title,
  subTitle,
  type,
  stamps,
  layout = "grid",
  isRecentSales = false,
  filterBy,
  showDetails = false,
  showEdition = false,
  gridClass,
  displayCounts,
  pagination,
  showMinDetails = false,
  variant = "default",
  viewAllLink,
  alignRight = false,
  fromPage = "",
  sortBy = "ASC",
}: StampSectionProps) {
  /* ===== STATE ===== */
  const swiperRef = useRef<Swiper | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(
    displayCounts?.mobileSm || 16,
  );

  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  /* ===== EVENT HANDLERS ===== */
  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  const handlePageChange = (page: number) => {
    pagination?.onPageChange?.(page);
  };

  /* ===== DATA PROCESSING ===== */
  // Filter stamps based on filterBy prop if provided
  const filteredStamps = filterBy
    ? (stamps || []).filter((stamp) => {
      if (Array.isArray(filterBy)) {
        // Handle array of filters
        return filterBy.some((filter) => {
          switch (filter) {
            case "pixel":
              return stamp.stamp_mimetype.includes("image");
            case "vector":
              return stamp.stamp_mimetype === "image/svg+xml";
            case "for sale":
              return stamp.unbound_quantity > 0;
            case "trending sales":
              return stamp.recentSalePrice !== undefined;
            case "sold":
              return stamp.sale_data !== undefined;
            case "recursive":
              return stamp.stamp_mimetype === "text/html";
            default:
              return true;
          }
        });
      }
      return true;
    })
    : stamps || [];

  // Apply layout-specific styling
  const containerClass = layout === "grid" ? gridClass : "flex flex-col gap-4"; // Row layout default styling
  const seeAllLink = viewAllLink ||
    (type === "all" ? "/stamp" : `/stamp?type=${type}`);

  /* ===== EFFECTS ===== */
  // Update display count based on window width
  useEffect(() => {
    const handleResize = () => {
      const width = globalThis.innerWidth;
      if (displayCounts) {
        if (width >= BREAKPOINTS.desktop) {
          setDisplayCount(
            displayCounts.desktop || displayCounts.tablet ||
              displayCounts.mobileLg || displayCounts.mobileSm || stamps.length,
          );
        } else if (width >= BREAKPOINTS.tablet) {
          setDisplayCount(
            displayCounts.tablet || displayCounts.mobileLg ||
              displayCounts.mobileSm || stamps.length,
          );
        } else if (width >= BREAKPOINTS.mobileLg) {
          setDisplayCount(
            displayCounts.mobileLg || displayCounts.mobileSm || stamps.length,
          );
        } else {
          setDisplayCount(displayCounts.mobileSm || stamps.length);
        }
      } else {
        setDisplayCount(stamps.length);
      }
    };

    handleResize();
    globalThis.addEventListener("resize", handleResize);
    return () => globalThis.removeEventListener("resize", handleResize);
  }, [displayCounts, stamps.length]);

  // Handle pagination loading state
  useEffect(() => {
    if (pagination) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [pagination?.page]);

  // Initialize Swiper
  useEffect(() => {
    swiperRef.current = new Swiper(".swiper-container", {
      modules: [Navigation, Autoplay],
      slidesPerView: 3,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        360: { slidesPerView: 3 }, // mobileSm
        568: { slidesPerView: 4 }, // mobileMd
        768: { slidesPerView: 5 }, // mobileLg
        1024: { slidesPerView: 6 }, // tablet
        1440: { slidesPerView: 8 }, // desktop
      },
    });

    return () => swiperRef.current?.destroy();
  }, []);

  /* ===== RENDER ===== */
  return (
    <div class="w-full">
      {/* ===== SECTION HEADER ===== */}
      <div class="w-full flex justify-between items-center">
        <div class="flex flex-col w-full">
          {title && (
            <div
              class={`flex flex-col items-start ${
                alignRight && "tablet:items-end"
              }`}
            >
              <h1
                class={`${
                  alignRight ? titlePurpleLD : titlePurpleDL
                } tablet:hidden`}
              >
                {title}
              </h1>
              <h1
                class={`hidden tablet:block ${
                  alignRight ? titlePurpleLD : titlePurpleDL
                }`}
              >
                {title}
              </h1>
            </div>
          )}
          {subTitle && (
            <div
              class={`flex flex-col items-start ${
                alignRight && "tablet:items-end"
              }`}
            >
              <h2 className={subtitlePurple}>
                {subTitle}
              </h2>
            </div>
          )}
        </div>

        {fromPage === "collection" &&
          (
            <div class="flex gap-1 items-center">
              <div
                class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
              >
                <Sort initSort={sortBy} />
              </div>
              <div
                class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
              >
                <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
              </div>
            </div>
          )}
      </div>

      {/* ===== STAMP CONTENT ===== */}
      {((viewAllLink && viewAllLink !== "/stamp/art" &&
          viewAllLink !== "/collection/overview/posh" && fromPage == "home") ||
          fromPage === "stamp_detail")
        ? (
          <div class="swiper-container overflow-hidden">
            <div class="swiper-wrapper">
              {isLoading ? <div>Loading...</div> : (
                filteredStamps.map((stamp: StampRow) => (
                  <div
                    class="swiper-slide"
                    key={isRecentSales && stamp.sale_data
                      ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}`
                      : stamp.tx_hash}
                  >
                    <StampCard
                      stamp={stamp}
                      isRecentSale={isRecentSales}
                      showDetails={showDetails}
                      showEdition={showEdition}
                      showMinDetails={showMinDetails}
                      variant={variant}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
        : (
          <div class={containerClass}>
            {isLoading ? <div>Loading...</div> : (
              filteredStamps.slice(0, displayCount).map((stamp: StampRow) => (
                <div
                  key={isRecentSales && stamp.sale_data
                    ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}`
                    : stamp.tx_hash}
                >
                  <StampCard
                    stamp={stamp}
                    isRecentSale={isRecentSales}
                    showDetails={showDetails}
                    showEdition={showEdition}
                    showMinDetails={showMinDetails}
                    variant={variant}
                  />
                </div>
              ))
            )}
          </div>
        )}

      {/* ===== NAVIGATION CONTROLS ===== */}
      {viewAllLink && <ViewAllButton href={seeAllLink} />}

      {pagination && pagination.totalPages > 1 && (
        <div class="mt-9 mobileLg:mt-[72px]">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prefix={pagination.prefix || ""}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
