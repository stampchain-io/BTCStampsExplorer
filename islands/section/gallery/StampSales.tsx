/* ===== RECENT SALES GALLERY COMPONENT ===== */
/*@baba-153+154-move Refreshing to ViewAllButton-remove default (not used)*/
import { container3, loaderSpinXsGrey } from "$layout";
import { notificationTextError } from "$notification";
import { StampGallery } from "$section";
import { titlePrimary, valueDarkSm } from "$text";
import type { StampWithEnhancedSaleData } from "$types/marketData.d.ts";
import type { StampSalesProps } from "$types/ui.d.ts";
import { useEffect, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export function StampSalesGallery({
  initialData = [],
  title,
  subTitle,
}: StampSalesProps) {
  /* ===== STATE ===== */
  const [recentSales, setRecentSales] = useState<StampWithEnhancedSaleData[]>(
    initialData,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===== OPTIMIZED DATA FETCHING ===== */
  const fetchRecentSales = async () => {
    // Skip fetching if we already have initial data and this is the first load
    if (initialData.length > 0 && recentSales.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        "/api/internal/stamp-recent-sales?page=1&limit=8",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recent sales");
      }
      const data = await response.json();
      const salesWithData = (data.data || []).map(
        (stamp: StampWithEnhancedSaleData) => {
          if (!stamp.sale_data) {
            console.warn(`Stamp ${stamp.tx_hash} missing sale_data`);
          }
          return stamp;
        },
      );
      setRecentSales(salesWithData);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      setError("Failed to load recent sales");
    } finally {
      setIsLoading(false);
    }
  };

  /* ===== OPTIMIZED EFFECTS FOR DENO FRESH SSR ===== */
  useEffect(() => {
    // Initialize with server-side data if available
    if (initialData.length > 0 && recentSales.length === 0) {
      setRecentSales(initialData);
    }

    // Only fetch client-side if no initial data was provided
    if (initialData.length === 0) {
      fetchRecentSales();
    }

    // Set up refresh interval for live updates (but less aggressive for SSR)
    const refreshInterval = setInterval(fetchRecentSales, 180000); // 3 minutes
    return () => clearInterval(refreshInterval);
  }, [initialData.length]); // Depend on initialData.length to handle server-side updates

  /* ===== ERROR HANDLING ===== */
  if (error) {
    return (
      <div
        class={`${notificationTextError} font-semibold text-base text-center py-4`}
      >
        {error}
      </div>
    );
  }

  /* ===== SECTION PROPS ===== */
  // Filter for hot stamps when activity data is available
  const filteredStamps = recentSales.length > 0
    ? recentSales.filter((stamp) => {
      // If activity_level is available, filter for 24H, 7D, 30D sales
      if (stamp.activity_level) {
        return ["HOT", "WARM", "COOL"].includes(stamp.activity_level);
      }
      // Fallback: show all recent sales if no activity data
      return true;
    })
    : recentSales;

  const sectionProps = {
    subTitle: subTitle || "RECENT SALES",
    type: "recent",
    stamps: filteredStamps,
    fromPage: "home",
    isRecentSales: true,
    variant: "cardVerticalSaleCompact" as const,
    viewAllLink: "/marketplace?market=sales",
    // Rendered via the swiper/carousel path in StampGallery, so slide
    // counts (not gridClass) control the columns shown per breakpoint
    swiperSlidesPerView: 2,
    swiperBreakpoints: {
      460: { slidesPerView: 3 },
      568: { slidesPerView: 4 },
      820: { slidesPerView: 5 },
      1024: { slidesPerView: 6 },
      1440: { slidesPerView: 8 },
    },
  };

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col">
      {title && <h3 class={titlePrimary}>{title}</h3>}
      <div class="flex flex-col">
        {filteredStamps.length === 0 && !isLoading && (
          <div class={`${container3} ${valueDarkSm} text-center py-8`}>
            <h6 class="text-base">NO RECENT SALES AVAILABLE AT THE MOMENT</h6>
          </div>
        )}
        {filteredStamps.length > 0 && <StampGallery {...sectionProps} />}
        {isLoading && (
          <div class="flex items-center gap-3 -mt-[29px] mb-[9px]">
            <div class={loaderSpinXsGrey} />
            <div class="animate-pulse font-medium text-xs text-color-grey">
              REFRESHING
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
