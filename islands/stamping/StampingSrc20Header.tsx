import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const StampingSrc20Header = (
  { selectedTab }: {
    selectedTab: string;
  },
) => {
  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        <a
          href="/stamping/src20/mint"
          class={selectedTab === "mint"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
        >
          Mint
        </a>
        <a
          href="/stamping/src20/deploy"
          class={selectedTab === "deploy"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
        >
          Deploy
        </a>
        <a
          href="/stamping/src20/transfer"
          class={selectedTab === "transfer"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
        >
          Transfer
        </a>
      </div>
      <div class="flex gap-6">
        <StampSearchClient />
      </div>
    </div>
  );
};
