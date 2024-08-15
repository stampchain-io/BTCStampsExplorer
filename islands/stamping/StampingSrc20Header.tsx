import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const StampingSrc20Header = (
  { selectedTab }: {
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        <p
          class={selectedTab === "mint"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamping/src20", "mint")}
        >
          Mint
        </p>
        <p
          class={selectedTab === "deploy"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamping/src20", "deploy")}
        >
          Deploy
        </p>
        <p
          class={selectedTab === "transfer"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamping/src20", "transfer")}
        >
          Transfer
        </p>
      </div>
      <div class="flex gap-6">
        <StampSearchClient />
      </div>
    </div>
  );
};
