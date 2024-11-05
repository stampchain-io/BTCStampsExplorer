import { Collection } from "globals";
import { CollectionOverviewCard } from "../../components/collection/CollectionOverviewCard.tsx";
type CollectionOverviewArtistContentProps = {
  collections: Collection[];
};
export function CollectionOverviewArtistContent(
  { collections }: CollectionOverviewArtistContentProps,
) {
  return (
    <div class="flex flex-col gap-4">
      {/* <CollectionCreateButton /> */}
      <div className="flex flex-col gap-6">
        {collections.map((collection) => (
          <CollectionOverviewCard
            key={collection.collection_id}
            collection={collection}
          />
        ))}
      </div>
    </div>
  );
}
