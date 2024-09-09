import { StampRow, StampSectionProps } from "globals";
import StampSection from "$components/stamp/StampSection.tsx";
// import { Partial } from "$fresh/runtime.ts";

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
  const sections: StampSectionProps[] = [
    { title: "POSH", type: "posh", stamps: stamps_posh, layout: "grid" },
    { title: "CLASSIC", type: "classic", stamps: stamps_art, layout: "grid" },
    {
      title: "RECENT SALES",
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
    },
  ];

  return (
    <div>
      <h1 class="text-3xl md:text-7xl text-left mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#7200B4] to-[#FF00E9] font-black">
        LATEST STAMPS
      </h1>
      <div class="flex flex-col gap-12">
        {sections.map((section) => (
          <StampSection key={section.type} {...section} />
        ))}
      </div>
    </div>
  );
}
