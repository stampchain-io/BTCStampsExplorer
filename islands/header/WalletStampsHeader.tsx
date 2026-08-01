/* ===== WALLET STAMPS HEADER COMPONENT ===== */
import { SelectorButtons } from "$button";
import { SortButton } from "$islands/button/SortButton.tsx";
import { ViewButton } from "$islands/button/ViewButton.tsx";
import { container2Icon } from "$layout";
import {
  getCurrentPathname,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import { subtitlePrimary } from "$text";
import type { WalletStampsHeaderProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export const WalletStampsHeader = (
  {
    activeTab = "collected",
    viewMode = "cardVertical",
  }: WalletStampsHeaderProps,
) => {
  /* ===== EVENT HANDLERS ===== */
  const handleTabChange = (tab: string) => {
    if (typeof globalThis === "undefined" || !globalThis?.location) return;
    const params = new URLSearchParams(globalThis.location.search);
    if (tab === "collected") {
      params.delete("stampsTab");
    } else {
      params.set("stampsTab", tab);
    }
    params.delete("stamps_page");
    const query = params.toString();
    safeNavigate(getCurrentPathname() + (query ? `?${query}` : ""));
  };

  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-col w-full gap-1.5">
      <div class="flex flex-row justify-between items-start w-full">
        <h2 class={subtitlePrimary}>STAMPS</h2>
      </div>

      <div class="flex flex-col mobileMd:flex-row justify-between mobileMd:items-center w-full">
        {/* Sub-tab Selector - Left */}
        <div class="flex gap-3">
          <SelectorButtons
            options={[
              { value: "collected", label: "COLLECTED" },
              { value: "stamped", label: "STAMPED" },
              { value: "listings", label: "LISTINGS" },
              { value: "collections", label: "COLLECTIONS" },
            ]}
            value={activeTab}
            onChange={handleTabChange}
            size="xsR"
            color="primary"
            className="w-full mobileMd:w-auto"
          />
        </div>

        {/* View Toggle + Sort Controls - Right */}
        <div class="flex justify-between mobileMd:justify-end pt-3 mobileMd:pt-0 gap-3">
          <div class={container2Icon}>
            <ViewButton viewMode={viewMode} paramName="stampsView" />
          </div>
          <div class={`${container2Icon} gap-1.5 tablet:gap-1`}>
            <SortButton sortParam="stampsSortBy" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletStampsHeader;
