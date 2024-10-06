import { StampCard } from "$islands/stamp/StampCard.tsx";

const mock_stamp = {
  stamp: 548891,
  block_index: 851847,
  cpid: "GqgivDk87bkYkavFoERk",
  creator: "bc1q5hue5dpy6p2k25mx5smd9qysjxuuvvjkn6h9h6",
  creator_name: null,
  divisible: null,
  keyburn: 1,
  locked: null,
  stamp_base64: null,
  stamp_mimetype: "image/svg+xml",
  stamp_url:
    "https://stampchain.io/stamps/183f422a302a727e40a8582d04a9fd24cbd64deba853d585b187fda774c18024.svg",
  supply: null,
  block_time: "2024-07-12T17:44:12.000Z",
  tx_hash: "183f422a302a727e40a8582d04a9fd24cbd64deba853d585b187fda774c18024",
  tx_index: 566963,
  ident: "SRC-20",
  stamp_hash: "GqgivDk87bkYkavFoERk",
  is_btc_stamp: 1,
  file_hash: "828c74eed07712301119019f0d47b07a",
};

const LatestTransfer = () => {
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end">
      <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black">
        LATEST TRANSFERS
      </h1>
      <p className="text-2xl md:text-5xl text-[#AA00FF]">BLOCK #860325</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, index) => {
          return (
            <StampCard
              key={index}
              stamp={mock_stamp}
              kind="stamp"
              isRecentSale={false}
              showInfo={false}
            />
          );
        })}
      </div>
      <a className="text-[#8800CC] text-sm md:text-base font-extrabold border-2 border-[#8800CC] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
        View All
      </a>
    </div>
  );
};

export default LatestTransfer;
