import { StampRow, StampSectionProps } from "globals";

import StampSection from "$components/stamp/StampSection.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";
import { Collection } from "globals";

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
  const SectionsLatestArtStamps: StampSectionProps[] = [
    {
      title: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full
        gap-[12px]
        gap-[12px]
        mobile-360:gap-[12px]
        mobile-768:gap-[24px]
        tablet:gap-[24px]
        desktop:gap-[24px]
        grid-cols-2
        mobile-360:grid-cols-2
        mobile-768:grid-cols-3
        tablet:grid-cols-3
        desktop:grid-cols-4
        auto-rows-fr
      `,
      displayCounts: {
        "mobile-360": 8, // 2 columns x 4 rows
        "mobile-768": 12, // 3 columns x 4 rows
        "tablet": 12, // 3 columns x 4 rows
        "desktop": 16, // 4 columns x 4 rows
      },
    },
  ];

  const SectionsCollections: StampSectionProps[] = [
    {
      title: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full
        gap-[12px]
        mobile-360:gap-[12px]
        mobile-768:gap-[24px]
        tablet:gap-[24px]
        desktop:gap-[24px]
        grid-cols-2
        mobile-360:grid-cols-2
        mobile-768:grid-cols-4
        tablet:grid-cols-3
        desktop:grid-cols-4
        auto-rows-fr
      `,
      displayCounts: {
        "mobile-360": 4, // 2 columns x 2 rows
        "mobile-768": 8, // 4 columns x 2 rows
        "tablet": 6, // 3 columns x 2 rows
        "desktop": 8, // 4 columns x 2 rows
      },
    },
    {
      title: "RECENT RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      layout: "grid",
      showDetails: false,
      gridClass: `
        grid w-full
        gap-[12px]
        mobile-360:gap-[12px]
        mobile-768:gap-[24px]
        tablet:gap-[24px]
        desktop:gap-[24px]
        grid-cols-2
        mobile-360:grid-cols-3
        mobile-768:grid-cols-4
        tablet:grid-cols-4
        desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobile-360": 6, // 3 columns x 2 rows
        "mobile-768": 8, // 4 columns x 2 rows
        "tablet": 8, // 4 columns x 2 rows
        "desktop": 12, // 6 columns x 2 rows
      },
    },
  ];

  const SectionsRecentSales: StampSectionProps[] = [
    {
      title: "HOT STAMPS",
      type: "recent",
      stamps: stamps_recent,
      layout: "grid",
      isRecentSales: true,
      showDetails: true,
      gridClass: `
        grid w-full
        gap-[12px]
        mobile-360:gap-[12px]
        mobile-768:gap-[24px]
        tablet:gap-[24px]
        desktop:gap-[24px]
        grid-cols-2
        mobile-360:grid-cols-3
        mobile-768:grid-cols-4
        tablet:grid-cols-4
        desktop:grid-cols-6
        auto-rows-fr
      `,
      displayCounts: {
        "mobile-360": 3, // 3 columns x 1 row
        "mobile-768": 4, // 4 columns x 1 row
        "tablet": 4, // 4 columns x 1 row
        "desktop": 6, // 6 columns x 1 row
      },
    },
  ];

  // const SectionSRC20: StampSectionProps[] = [
  //   {
  //     title: "ALL TOKENS",
  //     type: "src20",
  //     stamps: stamps_src20,
  //     layout: "row",
  //     showDetails: false,
  //   },
  // ];

  return (
    <div className="
      flex flex-col gap-8 mobile-768:gap-16
      px-3 tablet:px-6 desktop:px-12 
      max-w-desktop w-full mx-auto
    ">
      {/* LATEST ART STAMPS */}
      <div className="flex flex-col gap-4 mobile-768:gap-8">
        <div
          class={`
            w-full
            pb-0 pt-[18px]
            mobile-360:pb-0 mobile-360:pt-[18px]
            mobile-768:pb-0 mobile-768:pt-[36px]
            tablet:pb-0 tablet:pt-[72px]
            desktop:pb-0 desktop:pt-[72px]
          `}
        >
          <h1 className="
            text-4xl
            mobile-360:text-4xl
            mobile-768:text-5xl
            tablet:text-5xl
            desktop:text-6xl
            font-black bg-text-purple-2 bg-clip-text text-transparent
          ">
            LATEST ART STAMPS
          </h1>
        </div>
        <div className="flex flex-col gap-4">
          {SectionsLatestArtStamps.map((section) => (
            <StampSection key={section.title} {...section} />
          ))}
        </div>
      </div>

      {/* COLLECTIONS */}
      <div className="flex flex-col gap-4 mobile-768:gap-8">
        <div
          class={`
            w-full
            pb-0 pt-[18px]
            mobile-360:pb-0 mobile-360:pt-[18px]
            mobile-768:pb-0 mobile-768:pt-[36px]
            tablet:pb-0 tablet:pt-[72px]
            desktop:pb-0 desktop:pt-[72px]
          `}
        >
          <h1 className="
            text-4xl
            mobile-360:text-4xl
            mobile-768:text-5xl
            tablet:text-5xl
            desktop:text-6xl
            font-black bg-text-purple-2 bg-clip-text text-transparent
          ">
            COLLECTIONS
          </h1>
        </div>
        <div className="flex flex-col gap-4">
          {SectionsCollections.map((section) => (
            <StampSection key={section.title} {...section} />
          ))}
        </div>
      </div>

      {/* FEATURED COLLECTIONS */}
      <div className="flex flex-col gap-4 mobile-768:gap-8">
        <div
          class={`
            w-full
            pb-0 pt-[18px]
            mobile-360:pb-0 mobile-360:pt-[18px]
            mobile-768:pb-0 mobile-768:pt-[36px]
            tablet:pb-0 tablet:pt-[72px]
            desktop:pb-0 desktop:pt-[72px]
          `}
        >
          <h1 className="
            text-4xl
            mobile-360:text-4xl
            mobile-768:text-5xl
            tablet:text-5xl
            desktop:text-6xl
            font-black bg-text-gray-1 bg-clip-text text-transparent
          ">
            FEATURED COLLECTIONS
          </h1>
        </div>
        <CollectionList collections={collectionData} />
      </div>

      {/* RECENT SALES */}
      <div className="flex flex-col gap-4 mobile-768:gap-8">
        <div
          class={`
            w-full
            pb-0 pt-[18px]
            mobile-360:pb-0 mobile-360:pt-[18px]
            mobile-768:pb-0 mobile-768:pt-[36px]
            tablet:pb-0 tablet:pt-[72px]
            desktop:pb-0 desktop:pt-[72px]
          `}
        >
          <h1 className="
            text-4xl
            mobile-360:text-4xl
            mobile-768:text-5xl
            tablet:text-5xl
            desktop:text-6xl
            font-black bg-text-purple-2 bg-clip-text text-transparent
          ">
            RECENT SALES
          </h1>
        </div>
        <div className="flex flex-col gap-4">
          {SectionsRecentSales.map((section) => (
            <StampSection key={section.title} {...section} />
          ))}
        </div>
      </div>

      <GetStampingModule />
    </div>
  );
}
