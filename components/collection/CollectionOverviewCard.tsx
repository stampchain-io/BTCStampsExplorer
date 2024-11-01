import { Collection } from "globals";

export function CollectionOverviewCard(
  { collection }: { collection: Collection },
) {
  return (
    <a
      href={`/collection/${collection.collection_name}`}
      className="rounded-md w-full dark-gradient p-6 flex flex-col gap-6"
    >
      <div className="flex gap-6 w-full">
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px]"
        />
        <div className="text-[#666666] text-xl font-light w-full">
          <p class="text-5xl font-black purple-gradient1">
            {collection.collection_name}
          </p>
          <p>
            BY <span className="font-bold">bc1qhk...hlls5q</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-between w-full">
            <p>
              STAMPS <span className="font-bold text-[#999999]">XXX</span>
            </p>
            <p>
              VOLUME <span className="font-bold text-[#999999]">X.XXXX</span>
              {" "}
              BTC
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between w-full">
            <p>
              FLOOR PRICE{" "}
              <span className="font-bold text-[#999999]">X.XXXX</span> BTC
            </p>
            <p>
              MARKETCAP <span className="font-bold text-[#999999]">X.XXXX</span>
              {" "}
              BTC
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 2xl:grid-cols-8 gap-6">
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px]"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px]"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px]"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px]"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px] hidden md:block"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px] hidden md:block"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px] hidden 2xl:block"
        />
        <img
          src={collection.first_stamp_image}
          alt=""
          className="w-[140px] h-[140px] hidden 2xl:block"
        />
      </div>
    </a>
  );
}
