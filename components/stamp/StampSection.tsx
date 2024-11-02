import { useEffect, useState } from "preact/hooks";
import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts"; // Custom hook to get window size

const BREAKPOINTS = {
  desktop: 1025,
  tablet: 769,
  mobileLg: 569,
  mobileMd: 421,
  mobileSm: 360,
} as const;

export default function StampSection(
  {
    title,
    type,
    stamps,
    layout,
    isRecentSales,
    filterBy,
    showDetails = false,
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
        } else if (width >= BREAKPOINTS.mobileMd) {
          setDisplayCount(
            displayCounts.mobileMd ||
              displayCounts.mobileLg ||
              displayCounts.tablet ||
              displayCounts.desktop ||
              stampArray.length,
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
      {/* Section Title */}
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
