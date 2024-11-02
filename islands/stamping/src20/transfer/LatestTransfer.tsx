import { StampCard } from "$islands/stamp/StampCard.tsx";

const LatestTransfer = ({ transactions }) => {
  // Map transactions to match the expected shape by StampCard
  const stamps = transactions.map((tx) => ({
    ...tx,
    // Ensure all required properties for StampCard are included
  }));

  return (
    <div className="flex flex-col gap-4 items-start tablet:items-end">
      <h1 className="purple-gradient4 text-3xl tablet:text-6xl font-black">
        RECENT TRANSFERS
      </h1>
      {stamps.length > 0 && (
        <p className="text-2xl tablet:text-5xl text-[#AA00FF]">
          BLOCK #{stamps[0].block_index}
        </p>
      )}
      <div className="grid grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4 gap-2 tablet:gap-4">
        {stamps.map((stamp, index) => (
          <StampCard
            key={index}
            stamp={stamp}
            kind="stamp"
            isRecentSale={false}
            showInfo={false}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestTransfer;
