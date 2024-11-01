import { StampRow, StampSectionProps } from "globals";

import StampSection from "$components/stamp/StampSection.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";
import { Collection } from "globals";

export function HomeStampPreview({
  stamps_recent = [],
  stamps_src721 = [],
  stamps_art = [],
  stamps_src20 = [],
  stamps_posh = [],
  collectionData = [],
}: {
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  stamps_src721: StampRow[];
  stamps_recent: StampRow[];
  stamps_src20: StampRow[];
  collectionData: Collection[];
}) {
  const SectionsLatestArtStamps: StampSectionProps[] = [
    {
      title: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      layout: "grid",
      showDetails: false,
    },
  ];

  const SectionsCollections: StampSectionProps[] = [
    {
      title: "FRESH POSH STAMPS",
      type: "posh",
      stamps: stamps_posh,
      layout: "grid",
      showDetails: false,
    },
    {
      title: "RECENT RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      layout: "row",
      showDetails: false,
    },
  ];

  const SectionsRecentSales: StampSectionProps[] = [
    {
      title: "HOT STAMPS",
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
      isRecentSales: true,
      showDetails: true,
    },
  ];

  const SectionSRC20: StampSectionProps[] = [
    {
      title: "ALL TOKENS",
      type: "src20",
      stamps: stamps_src20,
      layout: "row",
      showDetails: false,
    },
  ];

  return (
    <div className="flex flex-col gap-16 mobile-lg:gap-36">
      <div className="flex flex-col gap-4 mobile-lg:gap-8">
        <h1 className="text-5xl mobile-lg:text-5xl desktop:text-6xl font-black bg-text-purple bg-clip-text text-transparent">
          LATEST ART STAMPS
        </h1>
        <div className="flex flex-col gap-12">
          {SectionsLatestArtStamps.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mobile-lg:gap-8">
        <h1 className="text-5xl mobile-lg:text-5xl desktop:text-6xl font-black bg-text-purple bg-clip-text text-transparent">
          COLLECTIONS
        </h1>
        <div className="flex flex-col gap-12">
          {SectionsCollections.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 mobile-lg:gap-8">
        <h1 className="text-5xl mobile-lg:text-5xl desktop:text-6xl font-black bg-text-gray bg-clip-text text-transparent">
          FEATURED COLLECTIONS
        </h1>
        <p className="text-stamp-text-primary text-2xl mobile-lg:text-5xl font-extralight hidden">
          LOREM IPSUM DOLOR
        </p>
        <CollectionList collections={collectionData} />
      </div>

      <div className="flex flex-col gap-4 mobile-lg:gap-8">
        <h1 className="text-5xl mobile-lg:text-5xl desktop:text-6xl font-black bg-text-purple bg-clip-text text-transparent">
          RECENT SALES
        </h1>
        <div className="flex flex-col gap-12">
          {SectionsRecentSales.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <GetStampingModule />
    </div>
  );
}
