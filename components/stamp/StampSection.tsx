import { useEffect, useState } from "preact/hooks";
import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts"; // Custom hook to get window size

export default function StampSection(
  {
    title,
    type,
    stamps,
    layout,
    isRecentSales,
    filterBy,
    showDetails = false,
    variant = "",
    gridClass,
    displayCounts,
  }: StampSectionProps,
) {
  const stampArray = Array.isArray(stamps) ? stamps : [];
  const [displayCount, setDisplayCount] = useState(stampArray.length);

  const params = new URLSearchParams();

  if (isRecentSales) {
    params.append("recentSales", "true");
  } else {
    if (type) {
      params.append("type", type);
    }

    const filterArray = typeof filterBy === "string"
      ? [filterBy]
      : Array.isArray(filterBy)
      ? filterBy
      : [];

    if (filterArray.length > 0) {
      params.append("filterBy", filterArray.join(","));
    }
  }

  const seeAllLink = `/stamp?${params.toString()}`;

  // Custom hook to get window size
  const { width } = useWindowSize();

  useEffect(() => {
    const updateDisplayCount = () => {
      if (displayCounts) {
        if (width >= 1025) {
          setDisplayCount(displayCounts.desktop || stampArray.length);
        } else if (width >= 769) {
          setDisplayCount(displayCounts.tablet || stampArray.length);
        } else if (width >= 569) {
          setDisplayCount(displayCounts["mobile-768"] || stampArray.length);
        } else {
          setDisplayCount(displayCounts["mobile-360"] || stampArray.length);
        }
      } else {
        setDisplayCount(stampArray.length);
      }
    };

    updateDisplayCount();
  }, [width, displayCounts, stampArray.length]);

  return (
    <div
      class={`
        w-full
        pt-[2px] pb-[18px]
        mobile-360:pt-[2px] mobile-360:pb-[18px]
        mobile-768:pt-[2px] mobile-768:pb-[36px]
        tablet:pt-[2px] tablet:pb-[72px]
        desktop:pt-[2px] desktop:pb-[72px]
      `}
    >
      {/* Section Title */}
      <div class="mb-2">
        <h2 class="
          text-2xl
          mobile-360:text-2xl
          mobile-768:text-4xl
          tablet:text-4xl
          desktop:text-5xl
          font-extralight bg-text-purple-2 bg-clip-text text-transparent
        ">
          {title}
        </h2>
      </div>

      {/* Grid Container */}
      <div class={gridClass}>
        {stampArray.slice(0, displayCount).map(
          (stamp: StampRow) => (
            <div key={stamp.tx_hash}>
              <StampCard
                stamp={stamp}
                kind="stamp"
                isRecentSale={isRecentSales}
                abbreviationLength={layout === "grid" ? 8 : 6}
                showDetails={showDetails}
              />
            </div>
          ),
        )}
      </div>

      <ViewAllButton href={seeAllLink} />
    </div>
  );
}
