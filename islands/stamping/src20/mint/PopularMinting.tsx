import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";

const PopularMinting = ({ transactions }) => {
  return (
    <div className="flex flex-col gap-4 items-start md:items-end">
      <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black">
        TRENDING
      </h1>
      <p className="text-2xl md:text-5xl text-[#AA00FF]">POPULAR TOKENS</p>
      {transactions.map((src20Item, index) => (
        <StampingMintingItem
          key={index}
          src20={src20Item}
        />
      ))}
    </div>
  );
};

export default PopularMinting;
