/* ===== COLLECTION OVERVIEW ARTIST CONTENT COMPONENT ===== */
import { Collection } from "$globals";
import { CollectionOverviewCard } from "$components/collection/CollectionOverviewCard.tsx";

/* ===== TYPES ===== */
type CollectionOverviewArtistContentProps = {
  collections: Collection[];
};

/* ===== COMPONENT ===== */
export function CollectionOverviewArtistContent(
  { collections }: CollectionOverviewArtistContentProps,
) {
  return (
    <div class="flex flex-col gap-6">
      {/* <CollectionCreateButton /> */}
      <div className="flex flex-col gap-6">
        {collections.map((collection) => {
          return (
            <>
              {collection.stamp_count != 0
                ? (
                  <CollectionOverviewCard
                    key={collection.collection_id}
                    collection={collection}
                  />
                )
                : <></>}
            </>
          );
        })}
      </div>
    </div>
  );
}
