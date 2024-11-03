import { Collection, StampRow } from "globals";

export const CollectionDetailsHeader = (
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  console.log("stamps: ", stamps);
  return (
    <div className="flex flex-col gap-3">
      <div className="dark-gradient p-6">
        <div className="flex gap-4">
          <img
            src={stamps[0].stamp_url}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `/not-available.png`;
            }}
            alt="collection image"
            className="h-[148px] w-[148px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
          />
          <div>
            <p className="font-black text-6xl purple-gradient3">
              {collection.collection_name}
            </p>
            <p className="text-[#666666] text-xl font-light">COLLECTION BY</p>
            <div>
              <p className="text-[#999999] text-4xl font-black">
                bc1qhk...hlls5q
              </p>
              <div>
                <img src="" alt="" />
                <img src="" alt="" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-[#999999]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ac
          magna ut tellus faucibus elementum ac in dolor. Integer consequat, est
          id mattis varius, enim lacus mollis lorem, sit amet lacinia felis erat
          eu sem. Mauris sit amet urna ultricies, dignissim leo at, efficitur
          lorem. Ut egestas ipsum quis fringilla dapibus. Sed at consequat
          tellus. Duis aliquam velit ac sem luctus, ac vestibulum velit
          malesuada.
        </p>
      </div>

      <div className="flex justify-between dark-gradient p-6">
        <div className="text-left">
          <p className="text-[#666666] text-xl font-light">STAMPS</p>
          <p className="text-[#999999] text-4xl font-black">{stamps.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[#666666] text-xl font-light">EDITIONS</p>
          <p className="text-[#999999] text-4xl font-black">N/A</p>
        </div>
        <div className="text-right">
          <p className="text-[#666666] text-xl font-light">FLOOR PRICE</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
      </div>

      <div className="flex justify-between dark-gradient p-6">
        <div className="text-left">
          <p className="text-[#666666] text-xl font-light">MARKETCAP</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[#666666] text-xl font-light">TOTAL VOLUME</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#666666] text-xl font-light">HOLDERS</p>
          <p className="text-[#999999] text-4xl font-black">N/A</p>
        </div>
      </div>
    </div>
  );
};
