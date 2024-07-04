import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";

export function HomeSalesInfo({ stamps = [] }: { stamps: [] }) {
  return (
    <div class="flex flex-col gap-12">
      <div>
        <div class="flex justify-between items-end">
          <p class="text-4xl text-[#F5F5F5]">Recent Sales</p>
          <a href="/home?type=recent">See all</a>
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
          <a href="/home?type=src721">See all</a>
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
          <a href="/home?type=art">See all</a>
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
          <a href="/home?type=src20">See all</a>
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
          <a href="/home?type=news">See all</a>
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
