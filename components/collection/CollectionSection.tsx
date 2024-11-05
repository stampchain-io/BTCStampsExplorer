import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import { ViewAllButton } from "$components/ViewAllButton.tsx";
export default function CollectionSection(
  { title, type, stamps, layout, isRecentSales, showDetails = false }:
    & StampSectionProps
    & { showDetails?: boolean },
) {
  const stampArray = Array.isArray(stamps)
    ? stamps.slice(0, layout === "grid" ? 12 : 12)
    : [];
  const seeAllLink = `/collection/overview/${type}`;

  return (
    <div>
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-[#AA00FF] text-4xl font-extralight">
          {title}
        </h2>
      </div>
      {/* Stamp Rows */}
      <div
        className={`
          grid w-full
          gap-3 mobileLg:gap-6
          ${
          layout === "grid"
            ? `grid-cols-2 
               mobileLg:grid-cols-3 
               desktop:grid-cols-4`
            : `grid-cols-3 
               mobileLg:grid-cols-4 
               desktop:grid-cols-6`
        }
          auto-rows-fr
        `}
      >
        {stampArray.map((stamp: StampRow) => (
          <div key={stamp.tx_hash}>
            <StampCard
              stamp={stamp}
              kind="stamp"
              isRecentSale={isRecentSales}
              abbreviationLength={layout === "grid" ? 8 : 6}
              showDetails={showDetails}
            />
          </div>
        ))}
      </div>
      <ViewAllButton href={seeAllLink} />
    </div>
  );
}
