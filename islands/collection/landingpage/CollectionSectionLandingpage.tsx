/* ===== COLLECTION OVERVIEW SECTION COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { Collection, CollectionSectionLandingpageProps } from "$globals";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { ViewAllButton } from "$buttons";
import { CollectionOverviewCard } from "$collection";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { subtitlePurple, titlePurpleLD } from "$text";

/* ===== STATE ===== */
export default function CollectionSectionLandingpage({
  title,
  subTitle,
  collections,
  gridClass,
  displayCounts,
}: CollectionSectionLandingpageProps) {
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

  /* ===== COMPONENT ===== */
  return (
    <div>
      {title && <h1 class={titlePurpleLD}>{title}</h1>}
      {subTitle && (
        <h2
          class={subtitlePurple +
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
