import { useEffect, useState } from "preact/hooks";
import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";

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
  }:
    & StampSectionProps
    & { showDetails?: boolean },
) {
  const stampArray = Array.isArray(stamps) ? stamps : [];
  const [displayCount, setDisplayCount] = useState(8);

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

  useEffect(() => {
    const updateDisplayCount = () => {
      const width = globalThis.innerWidth;
      if (width >= 1440) setDisplayCount(layout === "grid" ? 8 : 6);
      else if (width >= 1025) setDisplayCount(layout === "grid" ? 6 : 6);
      else if (width >= 769) setDisplayCount(layout === "grid" ? 8 : 4);
      else if (width >= 569) setDisplayCount(layout === "grid" ? 6 : 4);
      else if (width >= 420) setDisplayCount(layout === "grid" ? 6 : 3);
      else setDisplayCount(4);
    };

    updateDisplayCount();
    globalThis.addEventListener("resize", updateDisplayCount);
    return () => globalThis.removeEventListener("resize", updateDisplayCount);
  }, []);

  return (
    <div>
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-[#AA00FF] text-4xl lg:text-5xl font-extralight">
          {title}
        </h2>
      </div>

      {/* Stamp Rows */}
      <div
        className={layout === "grid"
          ? "grid w-full gap-4 grid-cols-2 mobile-sm:grid-cols-3 mobile-md:grid-cols-3 mobile-lg:grid-cols-4 tablet:grid-cols-3 desktop:grid-cols-4 grid-rows-2"
          : "grid w-full gap-2 grid-cols-2 mobile-sm:grid-cols-3 mobile-md:grid-cols-4 mobile-lg:grid-cols-4 tablet:grid-cols-6 desktop:grid-cols-6 grid-rows-1"}
      >
        {stampArray.slice(0, displayCount).map(
          (stamp: StampRow, index: number) => (
            <div
              key={stamp.tx_hash}
            >
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
