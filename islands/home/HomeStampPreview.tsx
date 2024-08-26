import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";
// import { Partial } from "$fresh/runtime.ts";

interface StampSection {
  title: string;
  type: string;
  stamps: StampRow[];
}

function StampSection({ title, type, stamps }: StampSection) {
  return (
    <div>
      <div class="flex justify-between items-end">
        <p class="text-2xl md:text-4xl text-[#F5F5F5]">{title}</p>
        <a
          href={`/stamp?ident=${type}`}
          f-partial={`/stamp?ident=${type}`}
          class="text-[#7A00F5]"
        >
          See all
        </a>
      </div>
      <div
        class={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 justify-center ${
          type === "recent" ? "" : "xl:grid-cols-6 xl:gap-6"
        }`}
      >
        {stamps.map((stamp: StampRow) => (
          <StampCard
            stamp={stamp}
            kind="stamp"
          />
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
    { title: "CLASSIC", type: "classic", stamps: stamps_art },
    { title: "POSH", type: "posh", stamps: stamps_posh },
    { title: "SRC-721/R", type: "src721", stamps: stamps_src721 },
    { title: "RECENT SALES", type: "recent", stamps: stamps_recent },
    { title: "SRC-20", type: "src20", stamps: stamps_src20 },
  ];

  return (
    <div>
      <h1 class="text-3xl md:text-6xl text-left mb-10 text-[#F5F5F5] font-black">
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
