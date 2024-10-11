import { StampRow, StampSectionProps } from "globals";
// import { Partial } from "$fresh/runtime.ts";

import StampSection from "$components/stamp/StampSection.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { StampChainModule } from "$islands/modules/StampChain.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";
import { DeployMintModule } from "$islands/modules/DeployMint.tsx";

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
  collectionData: CollectionRow[];
}) {
  const SectionsLatestArtStamps: StampSectionProps[] = [
    {
      title: "ON-CHAIN MARVELS",
      type: "classic",
      stamps: stamps_art,
      layout: "grid",
    },
  ];

  const SectionsCollections: StampSectionProps[] = [
    { title: "POSH", type: "posh", stamps: stamps_posh, layout: "grid" },
    {
      title: "RECURSIVE",
      filterBy: "recursive",
      stamps: stamps_src721,
      layout: "row",
    },
  ];

  const SectionsRecentSales: StampSectionProps[] = [
    {
      title: "HOT STAMPS",
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
      isRecentSales: true,
    },
  ];

  const SectionSRC20: StampSectionProps[] = [
    {
      title: "ALL TOKENS",
      type: "src20",
      stamps: stamps_src20,
      layout: "row",
    },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-36">
      <div className="flex flex-col gap-4 md:gap-8">
        <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] bg-clip-text text-transparent">
          LATEST ART STAMPS
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsLatestArtStamps.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-8">
        <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] bg-clip-text text-transparent">
          COLLECTIONS
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsCollections.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-8">
        <h1 class="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#666666] via-[#999999] to-[#CCCCCC] bg-clip-text text-transparent">
          FEATURED COLLECTIONS
        </h1>
        <p className="text-[#CCCCCC] text-2xl md:text-5xl font-extralight">
          LOREM IPSUM DOLOR
        </p>

        {/* FEATURED COLLECTIONS */}
        <CollectionList collections={collectionData} />
      </div>

      <div className="flex flex-col gap-4 md:gap-8">
        <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] bg-clip-text text-transparent">
          RECENT SALES
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsRecentSales.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>

      <GetStampingModule />

      <div className="flex flex-col gap-4 md:gap-8">
        <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] bg-clip-text text-transparent">
          SRC-20 TOKENS
        </h1>
        <div class="flex flex-col gap-12">
          {SectionSRC20.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
        <StampChainModule />
        {/* <DeployMintModule /> */}
      </div>
    </div>
  );
}
