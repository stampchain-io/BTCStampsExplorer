import { StampRow, StampSectionProps } from "globals";
// import { Partial } from "$fresh/runtime.ts";

import StampSection from "$components/stamp/StampSection.tsx";
import { GetStampingModule } from "$islands/modules/GetStamping.tsx";
import { StampChainModule } from "$islands/modules/Stampchain.tsx";
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
      type: "all",
      stamps: stamps_art,
      layout: "grid",
    },
  ];

  const SectionsCollections: StampSectionProps[] = [
    { title: "POSH", type: "posh", stamps: stamps_posh, layout: "grid" },
    {
      title: "RECURSIVE",
      type: "stamps",
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
    <div className={"flex flex-col gap-18 md:gap-36"}>
      <div>
        <h1 class="text-[60px] leading-normal text-left mb-8 font-black
                    bg-gradient-to-r from-gradient-start to-gradient-end
                    bg-clip-text text-transparent">
          LATEST ART STAMPS
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsLatestArtStamps.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>
      <div>
        <h1 class="text-[60px] leading-normal text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
          COLLECTIONS
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsCollections.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>
      {/* FEATURED COLLECTIONS */}
      <CollectionList collections={collectionData} />

      <div>
        <h1 class="text-[60px] leading-normal text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
          RECENT SALES
        </h1>
        <div class="flex flex-col gap-12">
          {SectionsRecentSales.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>
      <GetStampingModule />
      <div>
        <h1 class="text-[60px] leading-normal text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
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
