import { useEffect, useState } from "preact/hooks";
import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { BREAKPOINTS } from "$client/utils/constants.ts";

export default function StampSection({
  title,
  type,
  stamps,
  isRecentSales,
  filterBy,
  showDetails = false,
  gridClass,
  displayCounts,
  pagination,
  showMinDetails = false,
  variant = "default",
  viewAllLink,
}: StampSectionProps) {
  const stampArray = Array.isArray(stamps) ? stamps : [];
  const [displayCount, setDisplayCount] = useState(stampArray.length);
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowSize();

  // Build the "See All" link parameters
  const params = new URLSearchParams();
  if (isRecentSales) {
    params.append("recentSales", "true");
  } else if (type) {
    params.append("type", type);
  }
  if (filterBy) {
    const filterArray = Array.isArray(filterBy) ? filterBy : [filterBy];
    if (filterArray.length > 0) {
      params.append("filterBy", filterArray.join(","));
    }
  }
  const seeAllLink = viewAllLink ? viewAllLink : `/stamp?${params.toString()}`;

  // Handle display count updates
  useEffect(() => {
    const updateDisplayCount = () => {
      if (displayCounts) {
        if (width >= BREAKPOINTS.desktop) {
          setDisplayCount(displayCounts.desktop || stampArray.length);
        } else if (width >= BREAKPOINTS.tablet) {
          setDisplayCount(
            displayCounts.tablet || displayCounts.desktop || stampArray.length,
          );
        } else if (width >= BREAKPOINTS.mobileLg) {
          setDisplayCount(
            displayCounts.mobileLg || displayCounts.tablet ||
              displayCounts.desktop || stampArray.length,
          );
        } else {
          setDisplayCount(
            displayCounts.mobileSm ||
              displayCounts.mobileMd ||
              displayCounts.mobileLg ||
              displayCounts.tablet ||
              displayCounts.desktop ||
              stampArray.length,
          );
        }
      } else {
        setDisplayCount(stampArray.length);
      }
    };
    updateDisplayCount();
  }, [width, displayCounts, stampArray.length]);

  // Handle pagination loading state
  useEffect(() => {
    if (pagination) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, [pagination?.page]);

  return (
    <div
      class={`
        w-full
        pt-[2px] pb-[18px]
        mobileSm:pt-[2px] mobileSm:pb-[18px]
        mobileLg:pt-[2px] mobileLg:pb-[36px]
        tablet:pt-[2px] tablet:pb-[72px]
        desktop:pt-[2px] desktop:pb-[72px]
      `}
    >
      {title && (
        <div class="mb-2">
          <h2 class="
            text-2xl
            mobileSm:text-2xl
            mobileLg:text-4xl
            tablet:text-4xl
            desktop:text-5xl
            font-extralight bg-text-purple-2 bg-clip-text text-transparent
          ">
            {title}
          </h2>
        </div>
      )}

      <div class={gridClass}>
        {isLoading ? <div>Loading...</div> : (
          stampArray.slice(0, displayCount).map((stamp: StampRow) => (
            <div key={stamp.tx_hash}>
              <StampCard
                stamp={stamp}
                isRecentSale={isRecentSales}
                showDetails={showDetails}
                showMinDetails={showMinDetails}
                variant={variant}
              />
            </div>
          ))
        )}
      </div>

      {pagination
        ? (
          <div class="mt-4">
            <Pagination
              page={pagination.page}
              page_size={pagination.pageSize}
              type="stamp_card_id"
              data_length={pagination.total}
              pages={Math.ceil(pagination.total / pagination.pageSize)}
              disabled={isLoading}
            />
          </div>
        )
        : (
          <div className="flex justify-end mt-6">
            <ViewAllButton href={seeAllLink} />
          </div>
        )}
    </div>
  );
}
