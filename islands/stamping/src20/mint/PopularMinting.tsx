import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";

const PopularMinting = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 items-start tablet:items-end">
      <h1 className="purple-gradient4 text-3xl tablet:text-6xl font-black">
        TRENDING
      </h1>
      <p className="text-2xl tablet:text-5xl text-[#AA00FF]">POPULAR TOKENS</p>
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
