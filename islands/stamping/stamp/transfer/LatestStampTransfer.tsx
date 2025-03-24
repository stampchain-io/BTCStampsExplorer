import { useEffect, useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { JSX } from "preact";
import { StampRow } from "$globals";

export default function LatestTransfer(
  { latestStamps }: { latestStamps: StampRow[] },
): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampRow[]>([]);

  useEffect(() => {
    setTransactions(latestStamps);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div class="animate-pulse">Loading recent transfers...</div>;
  }

  return (
    <div class="flex flex-col items-start tablet:items-end">
      <h1 class={`${ModulesStyles.titlePurpleDL} tablet:hidden`}>
        STAMP TRANSFERS
      </h1>
      <h1 class={`hidden tablet:block ${ModulesStyles.titlePurpleLD}`}>
        STAMP TRANSFERS
      </h1>
      {transactions.length > 0 && (
        <h2 class={ModulesStyles.subTitlePurple}>
          BLOCK #{transactions[0].block_index}
        </h2>
      )}
      <div class="grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
        {transactions.map((stamp, index) => (
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
