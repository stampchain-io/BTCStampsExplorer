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
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 xl:gap-6 transition-opacity duration-700 ease-in-out">
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
