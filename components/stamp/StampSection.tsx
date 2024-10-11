import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";

export default function StampSection(
  { title, type, stamps, layout, isRecentSales, filterBy }: StampSectionProps,
) {
  const stampArray = Array.isArray(stamps) ? stamps : [];

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

  return (
    <div>
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-[#AA00FF] text-4xl lg:text-5xl font-extralight ">
          {title}
        </h2>
      </div>

      {/* Stamp Rows */}
      <div
        className={layout === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4"}
      >
        {stampArray.slice(0, layout === "grid" ? 12 : 6).map(
          (stamp: StampRow) => (
            <div
              className={layout === "grid" ? "" : "w-full"}
              key={stamp.tx_hash}
            >
              <StampCard
                stamp={stamp}
                kind="stamp"
                isRecentSale={isRecentSales}
                abbreviationLength={layout === "grid" ? 8 : 6}
              />
            </div>
          ),
        )}
      </div>

      {/* 'VIEW ALL' Button at the Bottom Right */}
      <div className="flex justify-end mt-4">
        <a
          href={seeAllLink}
          f-partial={seeAllLink}
          className="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 px-4 text-center min-w-[84px] rounded-md"
        >
          VIEW ALL
        </a>
      </div>
    </div>
  );
}
