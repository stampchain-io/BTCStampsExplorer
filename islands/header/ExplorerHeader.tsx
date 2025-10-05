/* ===== EXPLORER HEADER COMPONENT ===== */
import { SortButton } from "$islands/button/SortButton.tsx";
import { glassmorphism } from "$layout";
import { titleGreyLD } from "$text";

/* ===== COMPONENT ===== */
export const ExplorerHeader = () => {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-row justify-between items-start w-full">
      {/* Responsive Title Section */}
      <h1 class={titleGreyLD}>EXPLORER</h1>

      {/* Controls Section */}
      <div class="flex flex-col">
        <div
          class={`flex relative ${glassmorphism} !rounded-full
             items-start justify-between
             gap-7 py-1.5 px-5
             tablet:gap-5 tablet:py-1 tablet:px-4`}
        >
          <SortButton />
        </div>
      </div>
    </div>
  );
};
