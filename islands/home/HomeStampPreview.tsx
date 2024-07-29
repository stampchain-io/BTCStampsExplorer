import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";

export function HomeStampPreview(
  {
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
  },
) {
  return (
    <div class="flex flex-col gap-12">
      <div>
        <div class="flex justify-between items-end">
          <p class="text-2xl md:text-4xl text-[#F5F5F5]">Recent Sales</p>
          <a href="/home?type=recent">See all</a>
        </div>
        <div class="flex overflow-x-auto">
          {stamps_recent.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-2xl md:text-4xl text-[#F5F5F5]">Posh Stamps</p>
          <a href="/home?type=posh">See all</a>
        </div>
        <div class="flex overflow-x-auto">
          {stamps_posh.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-2xl md:text-4xl text-[#F5F5F5]">
            Latest SRC-721/721R Stamps
          </p>
          <a href="/home?type=src721">See all</a>
        </div>
        <div class="flex overflow-x-auto">
          {stamps_src721.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-2xl md:text-4xl text-[#F5F5F5]">Latest Art Stamps</p>
          <a href="/home?type=art">See all</a>
        </div>
        <div class="flex overflow-x-auto">
          {stamps_art.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-2xl md:text-4xl text-[#F5F5F5]">
            Latest SRC-20 Stamps
          </p>
          <a href="/home?type=src20">See all</a>
        </div>
        <div class="flex overflow-x-auto">
          {stamps_src20.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
