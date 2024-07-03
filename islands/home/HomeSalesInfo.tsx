import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";

export function HomeSalesInfo({ stamps = [] }: { stamps: [] }) {
  return (
    <div class="flex flex-col gap-8">
      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">Recent Sales</p>
          <p>See all</p>
        </div>
        <div class="flex">
          {stamps.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">Latest Src721/721r Stamps</p>
          <p>See all</p>
        </div>
        <div class="flex">
          {stamps.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">Latest Art Stamps</p>
          <p>See all</p>
        </div>
        <div class="flex">
          {stamps.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">Latest Src20 Stamps</p>
          <p>See all</p>
        </div>
        <div class="flex">
          {stamps.map((stamp: StampRow) => (
            <StampCard
              stamp={stamp}
              kind="stamp"
            />
          ))}
        </div>
      </div>

      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">News Banner</p>
          <p>See all</p>
        </div>
        <div class="flex">
          {stamps.map((stamp: StampRow) => (
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
