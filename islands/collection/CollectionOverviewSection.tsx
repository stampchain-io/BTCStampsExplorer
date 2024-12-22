import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionOverviewSectionProps } from "$globals";

import { BREAKPOINTS } from "$lib/utils/constants.ts";

import { ViewAllButton } from "$components/shared/ViewAllButton.tsx";
import { CollectionOverviewCard } from "$components/collection/CollectionOverviewCard.tsx";

import { ModulesStyles } from "$islands/modules/Styles.ts";

import { useWindowSize } from "$lib/hooks/useWindowSize.ts";

export default function CollectionOverviewSection({
  title,
  subTitle,
  collections,
  gridClass,
  displayCounts,
}: CollectionOverviewSectionProps) {
  const { width } = useWindowSize();

  const collectionArray = Array.isArray(collections) ? collections : [];
  const [displayCount, setDisplayCount] = useState(collectionArray.length);

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
      {title && <h1 class={ModulesStyles.titlePurpleDL}>{title}</h1>}
      {subTitle && (
        <h2
          class={ModulesStyles.subTitlePurple +
            " mb-3 mobileMd:mb-6 desktop:mb-9"}
        >
          {subTitle}
        </h2>
      )}
      <div class={gridClass}>
        {collectionArray.slice(0, displayCount).map((
          collection: Collection,
        ) => (
          <CollectionOverviewCard
            key={collection.collection_id}
            collection={collection}
          />
        ))}
      </div>
      <ViewAllButton href="/collection/overview/artist" />
    </div>
  );
}
