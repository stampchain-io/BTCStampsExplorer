import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const StampToolHeader = (
  { selectedTab }: {
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        <p
          class={selectedTab === "file"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp/tool", "file")}
        >
          File
        </p>
        <p
          class={selectedTab === "json"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp/tool", "json")}
        >
          JSON
        </p>
        <p
          class={selectedTab === "base64"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp/tool", "base64")}
        >
          Base64
        </p>
        <p
          class={selectedTab === "transfer"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp/tool", "transfer")}
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
