/* ===== WALLET SUB HEADER COMPONENT ===== */
import { SelectorButtons } from "$button";
import { SortButton } from "$islands/button/SortButton.tsx";
import { ViewButton } from "$islands/button/ViewButton.tsx";
import { container2Icon, ScrollFadeRow } from "$layout";
import {
  getCurrentPathname,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import { subtitlePrimary } from "$text";
import type { WalletSubHeaderProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export const WalletSubHeader = (
  {
    section = "all",
    tab = "balance",
    viewMode = "cardVertical",
  }: WalletSubHeaderProps,
) => {
  /* ===== EVENT HANDLERS ===== */
  const handleSectionChange = (value: string) => {
    if (typeof globalThis === "undefined" || !globalThis?.location) return;
    const params = new URLSearchParams(globalThis.location.search);
    if (value === "all") {
      params.delete("section");
    } else {
      params.set("section", value);
    }
    // Listings/Collections are stamps-only — fall back to Balance when the
    // newly selected section can no longer show them.
    if (
      value !== "stamps" && (tab === "listings" || tab === "collections")
    ) {
      params.delete("tab");
    }
    params.delete("stamps_page");
    params.delete("tokens_page");
    const query = params.toString();
    safeNavigate(getCurrentPathname() + (query ? `?${query}` : ""));
  };

  const handleTabChange = (value: string) => {
    if (typeof globalThis === "undefined" || !globalThis?.location) return;
    const params = new URLSearchParams(globalThis.location.search);
    if (value === "balance") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    params.delete("stamps_page");
    params.delete("tokens_page");
    const query = params.toString();
    safeNavigate(getCurrentPathname() + (query ? `?${query}` : ""));
  };

  /* ===== SUB-TAB OPTIONS ===== */
  // Listings/Collections have no Tokens equivalent — only offered when
  // Stamps is the active top-level section.
  const tabOptions = section === "stamps"
    ? [
      { value: "balance", label: "BALANCE" },
      { value: "created", label: "CREATED" },
      { value: "listings", label: "LISTINGS" },
      { value: "collections", label: "COLLECTIONS" },
    ]
    : [
      { value: "balance", label: "BALANCE" },
      { value: "created", label: "CREATED" },
    ];

  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-col w-full gap-1.5">
      <div class="flex flex-row justify-between items-start w-full -mb-2">
        <h2 class={subtitlePrimary}>PORTFOLIO</h2>
      </div>

      {/* Section Selector + Sub-tab Selector + View/Sort Controls */}
      <ScrollFadeRow deps={[section, tab]}>
        {/* Section Selector - Left */}
        <div class="shrink-0">
          <SelectorButtons
            options={[
              { value: "all", label: "ALL" },
              { value: "stamps", label: "STAMPS" },
              { value: "tokens", label: "TOKENS" },
            ]}
            value={section}
            onChange={handleSectionChange}
            size="xsR"
            color="primary"
          />
        </div>

        {/* Sub-tab Selector - Center */}
        <div class="grow shrink-0 flex justify-center">
          <SelectorButtons
            options={tabOptions}
            value={tab}
            onChange={handleTabChange}
            size="xsR"
            color="primary"
          />
        </div>

        {/* View Toggle + Sort Controls - Right */}
        <div class="flex shrink-0 gap-3">
          <div class={container2Icon}>
            <ViewButton viewMode={viewMode} paramName="view" />
          </div>
          <div class={`${container2Icon} gap-1.5 tablet:gap-1`}>
            <SortButton sortParam="sortBy" />
          </div>
        </div>
      </ScrollFadeRow>
    </div>
  );
};

export default WalletSubHeader;
