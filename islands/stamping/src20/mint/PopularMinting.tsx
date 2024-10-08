import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";

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

const PopularMinting = () => {
  return (
    <div className="flex flex-col gap-4 items-start md:items-end">
      <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black">
        TRENDING
      </h1>
      <p className="text-2xl md:text-5xl text-[#AA00FF]">POPULAR TOKENS</p>
      {Array(5).fill(0).map((_, index) => {
        return (
          <StampingMintingItem
            key={index}
            src20={mock_src20}
          />
        );
      })}
      {
        /* <a className="text-[#8800CC] text-sm md:text-base font-extrabold border-2 border-[#8800CC] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
        View All
      </a> */
      }
    </div>
  );
};

export default PopularMinting;
