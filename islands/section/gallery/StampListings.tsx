/* ===== NEW LISTINGS GALLERY COMPONENT ===== */
import { container2 } from "$layout";
import { StampGallery } from "$section";
import { titlePrimary, valueDarkSm } from "$text";
import type { StampListingsProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function StampListingsGallery({
  initialData = [],
  title,
  subTitle,
}: StampListingsProps) {
  /* ===== SECTION PROPS ===== */
  const sectionProps = {
    subTitle: subTitle || "New Listings",
    type: "all",
    stamps: initialData,
    variant: "cardHorizontalListingCompact" as const,
    viewAllLink: "/marketplace",
    gridClass: `
      grid w-full gap-4
      grid-cols-1 min-[520px]:grid-cols-2 mobileLg:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5
      auto-rows-fr
    `,
    displayCounts: {
      mobileSm: 4,
      mobileMd: 4,
      mobileLg: 6,
      tablet: 8,
      desktop: 10,
    },
  };

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col">
      {title && <h3 class={titlePrimary}>{title}</h3>}
      <div class="flex flex-col">
        {initialData.length === 0 && (
          <div class={`${container2} w-full h-[46px]`}>
            <h6 class={`${valueDarkSm} text-center`}>
              NO NEW LISTINGS AVAILABLE AT THE MOMENT
            </h6>
          </div>
        )}
        {initialData.length > 0 && <StampGallery {...sectionProps} />}
      </div>
    </div>
  );
}
