import { SRC20Card } from "$islands/src20/SRC20Card.tsx";

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
      <div class="w-full flex flex-col gap-4">
        {transactions.map((src20) => (
          <SRC20Card
            key={src20.tick}
            src20={src20}
            variant="minting"
            onImageClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
};

export default PopularMinting;
