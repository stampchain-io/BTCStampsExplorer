/* ===== COLLECTION SECTION COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionSectionProps } from "$globals";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { CollectionListCard } from "$collection";
import { subtitleGrey, titleGreyLD } from "$text";

/* ===== STATE ===== */
export default function CollectionSection({
  title,
  subTitle,
  collections,
  gridClass,
  displayCounts,
}: CollectionSectionProps) {
  const collectionArray = Array.isArray(collections) ? collections : [];
  const [displayCount, setDisplayCount] = useState(collectionArray.length);
  const { width } = useWindowSize();

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
      {title && <h3 class={titleGreyLD}>{title}</h3>}
      {subTitle && (
        <h4
          class={subtitleGrey +
            "mb-6"}
        >
          {subTitle}
        </h4>
      )}
      <div class={gridClass}>
        {collectionArray.slice(0, displayCount).map((
          collection: Collection,
          key: number,
        ) => (
          <CollectionListCard
            key={collection.collection_id}
            collection={collection}
            isDarkMode={key % 2 ? false : true}
          />
        ))}
      </div>
    </div>
  );
}
