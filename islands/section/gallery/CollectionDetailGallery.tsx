/* ===== COLLECTION DETAIL GALLERY COMPONENT ===== */
/* @baba - not updated */
import { ViewAllButton } from "$button";
import { CollectionCard } from "$card";
import type { Collection } from "$server/types/collection.d.ts";
import type { CollectionGalleryProps } from "$types/ui.d.ts";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { BREAKPOINTS } from "$constants";
import { subtitlePurple, titlePurpleLD } from "$text";
import { useEffect, useState } from "preact/hooks";

/* ===== STATE ===== */
export default function CollectionDetailGallery({
  title,
  subTitle,
  collections,
  gridClass,
  displayCounts,
  pagination,
}: CollectionGalleryProps) {
  const { width } = useWindowSize();
  const collectionArray = Array.isArray(collections) ? collections : [];
  const [displayCount, setDisplayCount] = useState(collectionArray.length);

  /* ===== EVENT HANDLERS ===== */
  const handlePageChange = (page: number) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(page);
    } else {
      // SSR-safe browser environment check
      if (typeof globalThis === "undefined" || !globalThis?.location) {
        return; // Cannot navigate during SSR
      }
      const url = new URL(globalThis.location.href);
      url.searchParams.set("page", page.toString());
      globalThis.location.href = url.toString();
    }
  };

  useEffect(() => {
    const updateDisplayCount = () => {
      if (displayCounts) {
        if (width >= BREAKPOINTS.desktop) {
          setDisplayCount(displayCounts.desktop || collectionArray.length);
        } else if (width >= BREAKPOINTS.tablet) {
          setDisplayCount(
            displayCounts.tablet || displayCounts.desktop ||
              collectionArray.length,
          );
        } else if (width >= BREAKPOINTS.mobileLg) {
          setDisplayCount(
            displayCounts.mobileLg || displayCounts.tablet ||
              displayCounts.desktop || collectionArray.length,
          );
        } else {
          setDisplayCount(
            displayCounts.mobileSm ||
              displayCounts.mobileMd ||
              displayCounts.mobileLg ||
              displayCounts.tablet ||
              displayCounts.desktop ||
              collectionArray.length,
          );
        }
      } else {
        setDisplayCount(collectionArray.length);
      }
    };
    updateDisplayCount();
  }, [width, displayCounts, collectionArray.length]);

  /* ===== RENDER ===== */
  return (
    <div>
      {title && <h3 class={titlePurpleLD}>{title}</h3>}
      {subTitle && (
        <h4
          class={subtitlePurple +
            " mb-3 mobileMd:mb-6 desktop:mb-9"}
        >
          {subTitle}
        </h4>
      )}
      <div class={gridClass}>
        {collectionArray.slice(0, displayCount).map((
          collection: Collection,
        ) => (
          <CollectionCard
            key={collection.collection_id}
            collection={collection}
          />
        ))}
      </div>
      <ViewAllButton href="/collection/artist" />

      {pagination && pagination.totalPages > 1 && (
        <div class="mt-12 mobileLg:mt-[72px]">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            {...(pagination.prefix && { prefix: pagination.prefix })}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
