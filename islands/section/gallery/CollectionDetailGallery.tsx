/* ===== COLLECTION DETAIL GALLERY COMPONENT ===== */
/* @baba - not updated */
import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionGalleryProps } from "$globals";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { ViewAllButton } from "$button";
import { CollectionCard } from "$card";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { subtitlePurple, titlePurpleLD } from "$text";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";

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
            prefix={pagination.prefix || ""}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
