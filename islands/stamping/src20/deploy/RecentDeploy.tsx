import { ModulesStyles } from "$islands/modules/Styles.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { DeployProps, StampTransaction } from "$lib/types/stamping.ts";
import type { JSX } from "preact";

export default function RecentDeploy(
  { transactions }: DeployProps,
): JSX.Element {
  const stamps = transactions.slice(0, 16).map((tx: StampTransaction) => ({
    ...tx,
  }));

  return (
    <div className="flex flex-col items-start tablet:items-end">
      <div>
        <h1 class={`${ModulesStyles.titlePurpleDLClassName} tablet:hidden`}>
          RECENT DEPLOYS
        </h1>
        <h1
          class={`hidden tablet:block ${ModulesStyles.titlePurpleLDClassName}`}
        >
          RECENT DEPLOYS
        </h1>
      </div>
      {stamps.length > 0 && (
        <h2 className={ModulesStyles.subTitlePurple}>
          BLOCK #{stamps[0].block_index}
        </h2>
      )}
      <div className="grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-3 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
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
