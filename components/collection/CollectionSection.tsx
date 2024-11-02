import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";

export default function CollectionSection(
  { title, type, stamps, layout, isRecentSales, showDetails = false }:
    & StampSectionProps
    & { showDetails?: boolean },
) {
  const stampArray = Array.isArray(stamps) ? stamps : [];

  const seeAllLink = `/collection/overview/${type}`;

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
          ? "grid gap-2 md:gap-4 grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4"
          : "grid gap-2 md:gap-4 grid-cols-4 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6"}
      >
        {stampArray.map(
          (stamp: StampRow, index: number) => (
            <div
              key={stamp.tx_hash}
              className={`${index >= 4 ? "hidden md:hidden xl:block" : ""}`}
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
