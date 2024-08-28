import { Collection } from "globals";
import { CollectionCard } from "../../components/collection/CollectionCard.tsx";
import { CollectionCreateButton } from "./CollectionCreateButton.tsx";

type CollectionListProps = {
  collections: Collection[];
};

export function CollectionList({ collections }: CollectionListProps) {
  return (
    <div class="flex flex-col gap-4">
      {/* <CollectionCreateButton /> */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.collection_id}
            collection={collection}
          />
        ))}
      </div>
    </div>
  );
}
