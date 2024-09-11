import { StampRow, StampSectionProps } from "globals";
// import { Partial } from "$fresh/runtime.ts";

import StampSection from "$components/stamp/StampSection.tsx";
import { HomeGetStamping } from "$islands/home/HomeGetStamping.tsx";

export function HomeStampPreview({
  stamps_recent = [],
  stamps_src721 = [],
  stamps_art = [],
  stamps_src20 = [],
  stamps_posh = [],
}: {
  stamps_art: StampRow[];
  stamps_posh: StampRow[];
  stamps_src721: StampRow[];
  stamps_recent: StampRow[];
  stamps_src20: StampRow[];
}) {
  const sections1: StampSectionProps[] = [
    { title: "POSH", type: "posh", stamps: stamps_posh, layout: "grid" },
    { title: "CLASSIC", type: "classic", stamps: stamps_art, layout: "grid" },
    { title: "RECURSIVE", type: "posh", stamps: stamps_posh, layout: "grid" },
  ];

  const sections2: StampSectionProps[] = [
    {
      title: "ALL STAMPS",
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
      isRecentSales: true,
    },
  ];

  const sections3: StampSectionProps[] = [
    {
      title: "ALL TOKENS",
      type: "src20",
      stamps: stamps_src20,
      layout: "row",
      isRecentSales: true,
    },
  ];

  return (
    <div className={"flex flex-col gap-18 md:gap-36"}>
      <div>
        <h1 class="text-3xl md:text-7xl text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
          LATEST ART STAMPS
        </h1>
        <div class="flex flex-col gap-12">
          {sections1.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>
      <HomeGetStamping />
      <div>
        <h1 class="text-3xl md:text-7xl text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
          RECENT SALES
        </h1>
        <div class="flex flex-col gap-12">
          {sections2.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
      </div>
      <div>
        <h1 class="text-3xl md:text-7xl text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
          SRC-20 TOKENS
        </h1>
        <div class="flex flex-col gap-12">
          {sections3.map((section) => (
            <StampSection key={section.type} {...section} />
          ))}
        </div>
        <div
          className={"flex flex-col md:flex-row justify-between md:items-end gap-16 md:gap-32"}
        >
          <div>
            <p
              className={"font-light text-2xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-[#666666] to-[#999999] text-left"}
            >
              DEPLOY // MINT
            </p>

            <p className={"text-[#CCCCCC] text-2xl font-medium"}>
              Lorem ipsum dolor sit amet, consectetur. Aenean diam libero,
              faucibus ut sagittis at, rutrum nec eros. Donec sit amet blandit
              arcu. Nullam ultrices a mauris non efficitur.
            </p>
          </div>

          <div className={"flex gap-12 font-extrabold text-xl justify-center"}>
            <a
              href="#"
              className={"border-2 border-[#999999] text-[#999999] w-[136px] h-[60px] flex justify-center items-center rounded-md"}
            >
              MINT
            </a>
            <a
              href="#"
              className={"bg-[#999999] text-black w-[136px] h-[60px] flex justify-center items-center rounded-md"}
            >
              DEPLOY
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
