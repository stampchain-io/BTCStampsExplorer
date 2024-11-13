import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionSectionProps } from "globals";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { BREAKPOINTS } from "$client/utils/constants.ts";
import { CollectionListCard } from "$components/collection/CollectionListCard.tsx";
export default function CollectionSection({
  collections,
  gridClass,
  displayCounts,
}: CollectionSectionProps) {
  const collectionArray = Array.isArray(collections) ? collections : [];
  const [displayCount, setDisplayCount] = useState(collectionArray.length);
  const { width } = useWindowSize();
  // Handle display count updates
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
  return (
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
  );
}
