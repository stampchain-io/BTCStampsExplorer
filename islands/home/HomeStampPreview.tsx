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
        {/* <a href={`/stamps?type=${type}`}>See all</a> */}
      </div>
      <div class="flex overflow-x-auto">
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
  stamps_recent: StampRow[];
  stamps_src721: StampRow[];
  stamps_art: StampRow[];
  stamps_src20: StampRow[];
  stamps_posh: StampRow[];
}) {
  const sections: StampSection[] = [
    { title: "Recent Sales", type: "recent", stamps: stamps_recent },
    { title: "Posh Stamps", type: "posh", stamps: stamps_posh },
    { title: "SRC-721/R Stamps", type: "src721", stamps: stamps_src721 },
    { title: "Classic Stamps", type: "classic", stamps: stamps_art },
    { title: "SRC-20 Stamps", type: "src20", stamps: stamps_src20 },
  ];

  return (
    <div class="flex flex-col gap-12">
      {sections.map((section) => (
        <StampSection key={section.type} {...section} />
      ))}
    </div>
  );
}
