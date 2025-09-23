/* ===== EXPLORER HEADER COMPONENT ===== */
import { SortButton } from "$islands/button/SortButton.tsx";
import { titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
export const ExplorerHeader = () => {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-row justify-between items-start w-full">
      {/* Responsive Title Section */}
      <h1 class={titlePurpleLD}>EXPLORER</h1>

      {/* Controls Section */}
      <div class="flex flex-col">
        <div class="flex relative items-start justify-between gap-4 tablet:gap-3">
          <SortButton />
        </div>
      </div>
    </div>
  );
};
