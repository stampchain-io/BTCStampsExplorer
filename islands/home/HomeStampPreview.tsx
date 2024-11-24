import {
  Collection,
  CollectionSectionProps,
  StampRow,
  StampSectionProps,
} from "globals";

import StampSection from "$islands/stamp/StampSection.tsx";
import CollectionSection from "$islands/collection/CollectionSection.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";

export function HomeStampPreview({
  stamps_recent = [],
  stamps_src721 = [],
  stamps_art = [],
  stamps_posh = [],
  collectionData = [],
}: {
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  stamps_src721: StampRow[];
  stamps_recent: StampRow[];
  collectionData: Collection[];
}) {
  const LatestArtStampsSection: StampSectionProps[] = [
    {
      subTitle: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-2 mobileLg:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 8, // 2 columns x 4 rows
        "mobileLg": 12, // 3 columns x 4 rows
        "tablet": 16, // 4 columns x 4 rows
        "desktop": 20, // 5 columns x 4 rows
      },
    },
  ];

  const FeaturedArtistsSection: CollectionSectionProps = {
    title: "FEATURED ARTISTS",
    subTitle: "POPULAR COLLECTIONS",
    collections: collectionData,
    gridClass: `
      grid
      grid-cols-2 tablet:grid-cols-3 gap-3 mobileLg:gap-6
    `,
    displayCounts: {
      "mobileSm": 2, // 2 columns x 1 rows
      "mobileLg": 2, // 2 columns x 1 rows
      "tablet": 3, // 3 columns x 1 rows
      "desktop": 3, // 3 columns x 1 rows
    },
  };

  const CollectionsSection: StampSectionProps[] = [
    {
      title: "COLLECTIONS",
      subTitle: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-2 mobileLg:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 4, // 2 columns x 2 rows
        "mobileLg": 6, // 3 columns x 2 rows
        "tablet": 8, // 4 columns x 2 rows
        "desktop": 10, // 5 columns x 2 rows
      },
    },
    {
      subTitle: "RECENT RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-4 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 8, // 4 columns x 2 rows
        "mobileLg": 10, // 5 columns x 2 rows
        "tablet": 12, // 6 columns x 2 rows
        "desktop": 12, // 6 columns x 2 rows
      },
    },
  ];

  const CuttingEdgeSection: CollectionSectionProps = {
    title: "CUTTING EDGE",
    subTitle: "RECURSIVE COLLECTIONS",
    collections: collectionData,
    gridClass: `
      grid
      grid-cols-2 tablet:grid-cols-3 gap-3 mobileLg:gap-6
    `,
    displayCounts: {
      "mobileSm": 2, // 2 columns x 1 rows
      "mobileLg": 2, // 2 columns x 1 rows
      "tablet": 3, // 3 columns x 1 rows
      "desktop": 3, // 3 columns x 1 rows
    },
  };

  const RecentSalesSection: StampSectionProps[] = [
    {
      title: "RECENT SALES",
      subTitle: "HOT STAMPS",
      type: "recent",
      stamps: stamps_recent,
      layout: "grid",
      isRecentSales: true,
      showDetails: false,
      showMinDetails: true,
      variant: "grey",
      gridClass: `
        grid w-full gap-3 mobileMd:gap-6
        grid-cols-4 mobileMd:grid-cols-5 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobileSm": 4, // 4 columns x 1 row
        "mobileMd": 5, // 5 columns x 1 row
        "mobileLg": 5, // 5 columns x 1 row
        "tablet": 6, // 6 columns x 1 row
        "desktop": 6, // 6 columns x 1 row
      },
    },
  ];

  return (
    <div className="
      flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36
      max-w-desktop w-full mx-auto
    ">
      {/* LATEST ART STAMPS */}
      <div className="flex flex-col">
        <div className="w-full">
          <h1 className={ModulesStyles.titlePurpleDL}>
            <span className="block mobileLg:hidden">LATEST STAMPS</span>
            <span className="hidden mobileLg:block">LATEST ART STAMPS</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 mobileMd:gap-6">
          {LatestArtStampsSection.map((section) => (
            <StampSection key={section.title} {...section} />
          ))}
        </div>
      </div>

      {/* FEATURED ARTISTS */}
      <CollectionSection {...FeaturedArtistsSection} />

      {/* COLLECTIONS */}
      {CollectionsSection.map((section) => (
        <StampSection key={section.title} {...section} />
      ))}

      {/* CUTTING EDGE */}
      <CollectionSection {...CuttingEdgeSection} />

      {/* RECENT SALES */}
      {RecentSalesSection.map((section) => (
        <StampSection key={section.title} {...section} />
      ))}
    </div>
  );
}
