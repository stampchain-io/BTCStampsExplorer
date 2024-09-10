import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

interface TabInfo {
  key: string;
  label: string;
  href: string;
}

const tabs: TabInfo[] = [
  { key: "mint", label: "MINT", href: "/stamping/src20/mint" },
  { key: "deploy", label: "DEPLOY", href: "/stamping/src20/deploy" },
  { key: "transfer", label: "TRANSFER", href: "/stamping/src20/transfer" },
];

export const StampingSrc20Header = (
  { selectedTab }: { selectedTab: string },
) => {
  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.href}
            class={`text-[19px] cursor-pointer pb-4 ${
              selectedTab === tab.key
                ? "text-[#7A00F5] font-semibold border-b-4 border-b-[#7A00F5]"
                : "text-[#B9B9B9]"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <div class="flex gap-6">
        <StampSearchClient />
      </div>
    </div>
  );
};
