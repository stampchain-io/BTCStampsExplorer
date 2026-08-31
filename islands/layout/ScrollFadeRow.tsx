/* ===== SCROLL FADE ROW COMPONENT ===== */
// Horizontally scrollable control row with edge fade masks that only
// appear while there is more content to scroll to in that direction.
// Used for header control rows (e.g. WalletHeaderContent, MarketplaceHeader,
// SRC20OverviewHeader) that need to fit many selector/icon groups on
// narrow screens without squeezing their content.
import { useScrollFade } from "$lib/hooks/useScrollFade.ts";
import type { ComponentChildren } from "preact";

interface ScrollFadeRowProps {
  children: ComponentChildren;
  class?: string;
  // Recompute fade state when these values change (e.g. active tab options
  // that alter the row's content width without changing its own box size).
  deps?: unknown[];
}

export const ScrollFadeRow = (
  { children, class: className = "", deps = [] }: ScrollFadeRowProps,
) => {
  const { rowRef, canScrollLeft, canScrollRight, updateScrollFade } =
    useScrollFade<HTMLDivElement>(deps);

  return (
    <div class="relative w-full">
      <div
        ref={rowRef}
        onScroll={updateScrollFade}
        class={`flex flex-row items-center w-full gap-3 overflow-x-auto tablet:overflow-x-visible scrollbar-hide ${className}`}
      >
        {children}
      </div>

      {/* Scroll fade masks - mobile only, shown only while scrollable in that direction */}
      <div
        class={`pointer-events-none absolute inset-y-0 left-0 w-7.5 tablet:hidden bg-gradient-to-r from-color-neutral-950/80 to-transparent transition-opacity duration-150 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        class={`pointer-events-none absolute inset-y-0 right-0 w-7.5 tablet:hidden bg-gradient-to-l from-color-neutral-950/80 to-transparent transition-opacity duration-150 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default ScrollFadeRow;
