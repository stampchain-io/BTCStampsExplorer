/* ===== ARTIST GALLERY COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionGalleryProps } from "$globals";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { ViewAllButton } from "$button";
import { CollectionCard } from "$card";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { subtitlePurple, titlePurpleLD } from "$text";

/* ===== STATE ===== */
export default function ArtistGallery({
  title,
  subTitle,
  collections,
  gridClass,
  displayCounts,
}: CollectionGalleryProps) {
  const { width } = useWindowSize();
  const collectionArray = Array.isArray(collections) ? collections : [];
  const [displayCount, setDisplayCount] = useState(collectionArray.length);

  /* ===== EVENT HANDLERS ===== */
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
    </div>
  );
}
