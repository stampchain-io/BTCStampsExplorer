import { StampCard } from "$islands/stamp/StampCard.tsx";

// FIXME: transition this to stampsection

const LatestTransfer = ({ transactions }) => {
  // Map transactions to match the expected shape by StampCard
  const stamps = transactions.map((tx) => ({
    ...tx,
    // Ensure all required properties for StampCard are included
  }));

  const titlePurpleDLClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";
  const titlePurpleLDClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3";
  const subTitlePurpleClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";

  return (
    <div className="flex flex-col items-start tablet:items-end">
      <h1 class={`${titlePurpleDLClassName} tablet:hidden`}>
        RECENT TRANSFERS
      </h1>
      <h1 class={`hidden tablet:block ${titlePurpleLDClassName}`}>
        RECENT TRANSFERS
      </h1>
      {stamps.length > 0 && (
        <h2 className={subTitlePurpleClassName}>
          BLOCK #{stamps[0].block_index}
        </h2>
      )}
      <div className="grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
        {stamps.map((stamp, index) => (
          <StampCard
            key={index}
            stamp={stamp}
            isRecentSale={false}
            showDetails={false}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestTransfer;
