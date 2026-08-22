/* ===== COLLECTION OVERVIEW CONTENT COMPONENT ===== */
import CollectionGallery from "$islands/section/gallery/CollectionGallery.tsx";
import type { CollectionOverviewContentProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function CollectionOverviewContent({
  collections = [],
  pagination,
}: CollectionOverviewContentProps) {
  /* ===== RENDER ===== */
  return (
    <div class="w-full pt-5">
      <CollectionGallery
        collections={collections}
        {...(pagination && { pagination })}
      />
    </div>
  );
}
