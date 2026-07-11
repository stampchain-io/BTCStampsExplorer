/* ===== STAMP OVERVIEW GALLERY COMPONENT ===== */
import { containerBackground, containerGap } from "$layout";
import { StampGallery, StampSalesGallery } from "$section";
import type {
  StampGalleryProps,
  StampOverviewGalleryProps,
} from "$types/stamp.d.ts";

/* ===== COMPONENT ===== */
export function StampOverviewGallery({
  stamps_src721 = [],
  stamps_art = [],
  stamps_posh = [],
  collectionData: _collectionData = [],
  recentSalesData = [],
}: StampOverviewGalleryProps) {
  /* ===== SECTION CONFIGURATION ===== */
  // Combine Classic, Posh, and Recursive stamps into a single gallery,
  // sorted by recency (tx_index) so the latest stamps across all types
  // surface first regardless of which type they belong to.
  const combinedStamps = [...stamps_art, ...stamps_posh, ...stamps_src721]
    .sort((a, b) => (b.tx_index ?? 0) - (a.tx_index ?? 0));

  const CombinedArtStampsSection: StampGalleryProps = {
    title: "ART STAMPS",
    subTitle: "LATEST CREATIONS",
    type: "all",
    stamps: combinedStamps,
    variant: "cardSquare" as const,
    viewAllLink: "/explorer?section=stamps",
    gridClass: `
      grid w-full gap-6
      grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6
      auto-rows-fr
    `,
    displayCounts: {
      mobileSm: 4,
      mobileMd: 6,
      mobileLg: 8,
      tablet: 10,
      desktop: 12,
    },
  };

  /* ===== RENDER ===== */
  return (
    <div class="
        flex flex-col max-w-desktop w-full mx-auto
        gap-12 mobileLg:gap-24 desktop:gap-36
      ">
      {/* ===== STAMPS SECTION ===== */}
      <div class={`${containerBackground} ${containerGap}`}>
        {/* ===== LATEST CREATIONS ===== */}
        <StampGallery {...CombinedArtStampsSection} />

        {/* ===== RECENT SALES ===== */}
        <StampSalesGallery
          subTitle="RECENT SALES"
          initialData={recentSalesData}
        />
      </div>
    </div>
  );
}
