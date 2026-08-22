/* ===== COLLECTION OVERVIEW CARD COMPONENT ===== */
import { container2Hover, containerPill, shadowGlowPurple } from "$layout";
import {
  abbreviateAddress,
  formatBTC,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { tooltipButton } from "$notification";
import {
  cardPrice,
  cardStampNumber,
  cardSupply,
  labelSm,
  textSm,
  valueSm,
} from "$text";
import type { CollectionWithOptionalMarketData } from "$types/index.d.ts";
import type { ComponentChildren } from "preact";

/* ===== PILL WITH TOOLTIP (instant on hover, no delay/timeout) ===== */
function PillWithTooltip(
  { label, className, children }: {
    label: string;
    className: string;
    children: ComponentChildren;
  },
) {
  return (
    <div class="relative group/pill">
      <div class={className}>{children}</div>
      <div
        class={`${tooltipButton} opacity-0 group-hover/pill:opacity-100 transition-opacity duration-150`}
      >
        {label}
      </div>
    </div>
  );
}

/* ===== HELPERS ===== */
// Visibility per gallery image index, aligned to the grid's column counts:
// base=4, min-[420px]=6, mobileMd=7, mobileLg=8, min-[880px]=9, tablet=7,
// desktop=9. Indices 7 and 8 need to reappear at mobileLg/min-[880px], hide
// again at tablet (fewer columns than the breakpoints just below it), then
// reappear at desktop - hence the non-cumulative classes.
const GALLERY_IMAGE_VISIBILITY = [
  "",
  "",
  "",
  "",
  "hidden min-[420px]:block",
  "hidden min-[420px]:block",
  "hidden mobileMd:block",
  "hidden mobileLg:block tablet:hidden desktop:block",
  "hidden min-[880px]:block tablet:hidden",
];

/* ===== COMPONENT ===== */
export function CollectionCard(
  { collection }: { collection: CollectionWithOptionalMarketData },
) {
  // Early return if collection is undefined
  if (!collection) {
    return null;
  }

  // Safe access to collection properties with fallbacks
  const collectionName = collection.collection_name ?? "Unknown Collection";
  const stampImage = collection.first_stamp_image ?? collection.img ?? "";
  const stampCount = collection.stamp_count ?? 0;

  const statsPills = (
    <>
      <PillWithTooltip
        label="STAMPS"
        className={`${containerPill} ${cardSupply}`}
      >
        {stampCount}
      </PillWithTooltip>
      <PillWithTooltip
        label="FLOOR PRICE"
        className={`${containerPill} ${cardPrice}`}
      >
        {collection.marketData?.floorPriceBTC
          ? formatBTC(collection.marketData.floorPriceBTC)
          : "N/A"} BTC
      </PillWithTooltip>
    </>
  );

  return (
    <a
      href={`/collection/${collectionName}`}
      className={`${container2Hover} ${shadowGlowPurple} !p-1 !gap-5 group`}
    >
      {/* ===== CARD HEADER ===== */}
      <div class="flex w-full gap-5">
        <div class="min-w-[126px] min-h-[126px] max-w-[126px] max-h-[126px] min-[480px]:min-w-[106px] min-[480px]:min-h-[106px] min-[480px]:max-w-[106px] min-[480px]:max-h-[106px] rounded-xl aspect-stamp image-rendering-pixelated overflow-hidden">
          <div class="relative flex items-center justify-center w-full h-full">
            <img
              src={stampImage}
              alt=""
              className="w-full h-full"
            />
          </div>
        </div>
        <div class="flex justify-between gap-3 w-full min-w-0">
          <div class="flex flex-col flex-1 min-w-0 mt-0.5">
            <h2 class={`${cardStampNumber} !text-lg`}>
              {collectionName.toUpperCase()}
            </h2>

            <h5 class={`${labelSm} mt-1`}>
              BY{" "}
              <span class={`${valueSm} normal-case`}>
                {collection.creators && collection.creators.length > 0
                  ? (
                    <>
                      {/* Use creator name if available, otherwise fall back to address */}
                      {collection.creator_names &&
                          collection.creator_names.length > 0
                        ? <span>{collection.creator_names?.[0] ?? ""}</span>
                        : (
                          <>
                            <span class="min-[420px]:hidden">
                              {abbreviateAddress(
                                collection.creators?.[0] ?? "",
                                4,
                              )}
                            </span>
                            <span class="hidden min-[420px]:inline mobileMd:hidden">
                              {abbreviateAddress(
                                collection.creators?.[0] ?? "",
                                6,
                              )}
                            </span>
                            <span class="hidden mobileMd:inline mobileLg:hidden tablet:inline desktop:hidden">
                              {abbreviateAddress(
                                collection.creators?.[0] ?? "",
                                8,
                              )}
                            </span>
                            <span class="hidden mobileLg:inline tablet:hidden desktop:inline">
                              {abbreviateAddress(
                                collection.creators?.[0] ?? "",
                                12,
                              )}
                            </span>
                          </>
                        )}
                    </>
                  )
                  : "N/A"}
              </span>
            </h5>

            {/* ===== STATS (base breakpoint, left-aligned below BY) ===== */}
            <div class="flex flex-col items-start min-[480px]:hidden gap-2 pt-2">
              {statsPills}
            </div>

            {collection.collection_description && (
              <h6
                class={`${textSm} hidden min-[480px]:line-clamp-2 pt-2`}
              >
                {collection.collection_description}
              </h6>
            )}
          </div>

          {/* ===== STATS (min-[480px]+, top-right column) ===== */}
          <div class="hidden min-[480px]:flex flex-col items-end gap-2 shrink-0">
            {statsPills}
          </div>
        </div>
      </div>

      {/* ===== CARD GALLERY ===== */}
      <div class="grid grid-cols-4 min-[420px]:grid-cols-6 mobileMd:grid-cols-7 mobileLg:grid-cols-8 min-[880px]:grid-cols-9 tablet:grid-cols-7 desktop:grid-cols-8 mt-4 gap-5">
        {collection.stamp_images &&
          collection.stamp_images.slice(-9).reverse().map(
            (imageUrl: string, index: number) => {
              return (
                <div
                  className={`w-full h-full rounded-xl aspect-stamp image-rendering-pixelated overflow-hidden ${
                    GALLERY_IMAGE_VISIBILITY[index] ?? ""
                  }`}
                >
                  <div class="relative flex items-center justify-center w-full h-full">
                    <img
                      key={index}
                      src={imageUrl}
                      alt=""
                      className={`w-full h-full object-contain pixelart`}
                    />
                  </div>
                </div>
              );
            },
          )}
      </div>
    </a>
  );
}
