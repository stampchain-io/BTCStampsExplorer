import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionSectionProps } from "globals";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { BREAKPOINTS } from "$client/utils/constants.ts";
import { CollectionListCard } from "$components/collection/CollectionListCard.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";

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
    <div>
      {title && <h1 class={ModulesStyles.titleGreyDLClassName}>{title}</h1>}
      {subTitle && (
        <h2
          class={ModulesStyles.subTitleGrey +
            " mb-3 mobileMd:mb-6 desktop:mb-9"}
        >
          {subTitle}
        </h2>
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
