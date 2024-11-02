import { Collection } from "globals";

export function CollectionListCard({ collection }: { collection: Collection }) {
  return (
    <a
      href={`/collection/${collection.collection_name}`}
      className="border-2 border-[#666666] rounded-md relative w-full h-[150px]"
    >
      <div
        className={`bg-center bg-no-repeat bg-[length:100%] w-full h-full`}
        style={{
          backgroundImage: `url('${collection.first_stamp_image}')`,
        }}
      >
      </div>
      <div
        className={"w-full h-full bg-gradient-to-r from-[#CCCCCC] via-[#999999BD] to-[#6666663F] absolute left-0 top-0 opacity-10"}
      >
      </div>
      <h3 class="text-[13px] text-2xl font-black text-[#666666] absolute left-3 bottom-3">
        {collection.collection_name}
      </h3>
    </a>
  );
}
