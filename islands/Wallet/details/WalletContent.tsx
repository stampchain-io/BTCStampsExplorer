import { StampCard } from "$islands/stamp/StampCard.tsx";
import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";

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

const mock_src20 = {
  row_num: 1,
  tx_hash: "23765f9bc6b87e078b1f93ed213f90b9004998336575f726e46f34ddbea5e5f3",
  block_index: 788041,
  p: "SRC-20",
  op: "DEPLOY",
  tick: "kevin",
  creator: "bc1qqz5tvzm3uw3w4lruga8aylsk9fs93y0w8fysfe",
  amt: null,
  deci: 18,
  lim: "420000",
  max: "690000000",
  destination: "1BepCXzZ7RRcPaqUdvBp2jvkJcaRvHMGKz",
  block_time: "2023-05-03T09:17:37.000Z",
  creator_name: null,
  destination_name: "ARWYN",
  holders: 2200,
  mcap: 55.2,
  floor_unit_price: 8e-8,
  progress: "100",
};

const WalletContent = () => {
  return (
    <>
      <div className="grid grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
        {Array(8).fill(0).map((_, index) => {
          return (
            <StampCard
              key={index}
              stamp={mock_stamp}
              kind="stamp"
              isRecentSale={false}
              showInfo={true}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {Array(5).fill(0).map((_, index) => {
          return (
            <StampingMintingItem
              key={index}
              src20={mock_src20}
            />
          );
        })}
      </div>
    </>
  );
};

export default WalletContent;
