/* ===== STAMP OVERVIEW GALLERY COMPONENT ===== */
import { Collection, StampGalleryProps, StampRow } from "$globals";

import { StampGallery } from "$section";
import { titlePurpleDL } from "$text";

/* ===== TYPES ===== */
interface StampOverviewGalleryProps {
  stamps_art?: StampRow[];
  stamps_posh?: StampRow[];
  stamps_src721?: StampRow[];
  collectionData?: Collection[];
}

/* ===== COMPONENT ===== */
export function StampOverviewGallery({
  stamps_src721 = [],
  stamps_art = [],
  stamps_posh = [],
  collectionData: _collectionData = [],
}: StampOverviewGalleryProps) {
  /* ===== SECTION CONFIGURATIONS ===== */
  const LatestArtStampsSection: StampGalleryProps[] = [
    {
      subTitle: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      showEdition: false,
      viewAllLink: "/stamp/art",
      gridClass: `
        grid w-full gap-6
        grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 8,
        mobileMd: 12,
        mobileLg: 16,
        tablet: 20,
        desktop: 24,
      },
    },
  ];

  const CollectionsSection: StampGalleryProps[] = [
    {
      title: "COLLECTIONS",
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      showEdition: false,
      viewAllLink: "/collection/posh",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-6 desktop:grid-cols-7
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 4,
        mobileMd: 6,
        mobileLg: 8,
        tablet: 12,
        desktop: 14,
      },
    },
    {
      subTitle: "RECENT RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      fromPage: "home",
      layout: "grid",
      showDetails: false,
      viewAllLink: "/collection/recursive",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-4 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        mobileSm: 8,
        mobileLg: 10,
        tablet: 12,
        desktop: 12,
      },
    },
  ];

  /* ===== RENDER ===== */
  return (
    <div className="
        flex flex-col max-w-desktop w-full mx-auto
        gap-12 mobileLg:gap-24 desktop:gap-36
      ">
      {/* ===== LATEST ART STAMPS SECTION ===== */}
      <div className="flex flex-col">
        <div className="w-full">
          <h1 className={titlePurpleDL}>
            <span className="block mobileLg:hidden">LATEST STAMPS</span>
            <span className="hidden mobileLg:block">LATEST ART STAMPS</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 mobileMd:gap-6">
          {LatestArtStampsSection.map((section, index) => (
            <StampGallery key={index} {...section} />
          ))}
        </div>
      </div>

      {
        /* ===== FEATURED ARTISTS SECTION =====
      <CollectionGallery {...FeaturedArtistsSection} />*/
      }

      {/* ===== COLLECTIONS SECTION ===== */}
      {CollectionsSection.map((section, index) => (
        <StampGallery key={index} {...section} />
      ))}

      {
        /* ===== CUTTING EDGE SECTION =====
      <CollectionGallery {...CuttingEdgeSection} />*/
      }
    </div>
  );
}
