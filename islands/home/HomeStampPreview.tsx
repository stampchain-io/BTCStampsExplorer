import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";
// import { Partial } from "$fresh/runtime.ts";

interface StampSection {
  title: string;
  type: string;
  stamps: StampRow[];
  layout: "grid" | "row";
}

function StampSection({ title, type, stamps, layout }: StampSection) {
  return (
    <div>
      <div class="flex justify-between items-end mb-4">
        <p class="text-2xl md:text-3xl text-[#F5F5F5] font-extralight">
          {title}
        </p>
        <a
          href={`/stamp?ident=${type}`}
          f-partial={`/stamp?ident=${type}`}
          class="text-[#7A00F5] text-sm md:text-base font-light"
        >
          See all
        </a>
      </div>
      <div
        class={layout === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4"
          : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4"}
      >
        {stamps.slice(0, layout === "grid" ? 12 : 6).map((stamp: StampRow) => (
          <div class={layout === "grid" ? "" : "w-full"}>
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const sections: StampSection[] = [
    { title: "POSH", type: "posh", stamps: stamps_posh, layout: "grid" },
    { title: "CLASSICAL", type: "classic", stamps: stamps_art, layout: "grid" },
    {
      title: "RECENT SALES",
      type: "recent",
      stamps: stamps_recent,
      layout: "row",
    },
  ];

  return (
    <div>
      <h1 class="text-3xl md:text-5xl text-left mb-8 text-[#F5F5F5] font-medium">
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
