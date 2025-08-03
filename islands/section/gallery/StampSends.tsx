/* ===== STAMP RECENT SALES GALLERY COMPONENT ===== */
import { StampCard } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";
import type { JSX } from "preact";
import type { StampSendsGalleryProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export default function StampSendsGallery({
  serverData = [],
}: StampSendsGalleryProps): JSX.Element {
  // 🚀 SERVER-SIDE RENDERING: Use server data instead of client-side fetching
  const transactions = serverData;

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full items-start tablet:items-end">
      {/* ===== TITLE SECTION ===== */}
      <div class="w-full">
        <h3 class={`${titlePurpleLD} tablet:hidden`}>
          RECENT SALES
        </h3>
        <h3 class={`hidden tablet:block w-full text-right ${titlePurpleDL}`}>
          RECENT SALES
        </h3>
      </div>

      {/* Show block title */}
      <h4 class={`w-full text-right ${subtitlePurple}`}>
        {transactions.length > 0 && `BLOCK #${transactions[0].block_index}`}
      </h4>

      {/* ===== CONTENT ===== */}
      <div class="w-full grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
        {transactions.length > 0
          ? transactions.map((stamp, index) => (
            <StampCard
              key={index}
              stamp={stamp}
              isRecentSale
              showDetails={false}
            />
          ))
          : (
            // Show placeholder cards if no data
            [...Array(5)].map((_, index) => (
              <div
                key={index}
                class="aspect-square rounded bg-gray-200 animate-pulse"
              />
            ))
          )}
      </div>
    </div>
  );
}
