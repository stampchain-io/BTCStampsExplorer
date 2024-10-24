import { StampCard } from "$islands/stamp/StampCard.tsx";

const RecentDeploy = ({ transactions }) => {
  // Map transactions to match the expected shape by StampCard
  const stamps = transactions.slice(0, 16).map((tx) => ({
    ...tx,
    // Ensure all required properties for StampCard are included
  }));

  return (
    <div className="flex flex-col gap-4 items-start md:items-end">
      <h1 className="purple-gradient4 text-3xl md:text-6xl font-black">
        RECENT DEPLOYS
      </h1>
      {stamps.length > 0 && (
        <p className="text-2xl md:text-5xl text-[#AA00FF]">
          BLOCK #{stamps[0].block_index}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
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

export default RecentDeploy;
