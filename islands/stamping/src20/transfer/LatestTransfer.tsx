import { ModulesStyles } from "$islands/modules/Styles.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { StampTransaction, TransferProps } from "$lib/types/stamping.ts";
import type { JSX } from "preact";

export default function LatestTransfer(
  { transactions }: TransferProps,
): JSX.Element {
  const stamps = transactions.map((tx: StampTransaction) => ({
    ...tx,
  }));

  return (
    <div className="flex flex-col items-start tablet:items-end">
      <h1 class={`${ModulesStyles.titlePurpleDLClassName} tablet:hidden`}>
        RECENT TRANSFERS
      </h1>
      <h1 class={`hidden tablet:block ${ModulesStyles.titlePurpleLDClassName}`}>
        RECENT TRANSFERS
      </h1>
      {stamps.length > 0 && (
        <h2 className={ModulesStyles.subTitlePurple}>
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
}
