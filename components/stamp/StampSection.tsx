import { StampRow, StampSectionProps } from "globals";
import { StampCard } from "./StampCard.tsx";

export default function StampSection(
  { title, type, stamps, layout }: StampSectionProps,
) {
  return (
    <div>
      <div class="flex justify-between items-end mb-4">
        <p class="text-2xl md:text-3xl text-[#AA00FF] font-light">
          {title}
        </p>
        <a
          href={`/stamp?ident=${type}`}
          f-partial={`/stamp?ident=${type}`}
          class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 text-center min-w-[84px] rounded-md"
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
