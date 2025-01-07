import { useEffect, useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { StampTransaction } from "$lib/types/stamping.ts";
import type { JSX } from "preact";

export default function RecentRegister(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const response = await fetch("/api/internal/src20/recentTransactions");
        if (!response.ok) {
          throw new Error("Failed to fetch recent transactions");
        }
        const data = await response.json();
        setTransactions(data.deploy || []);
      } catch (error) {
        console.error("Error fetching recent deploys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  if (isLoading) {
    return <div class="animate-pulse">Loading recent registers...</div>;
  }

  return (
    <div class="flex flex-col items-start tablet:items-end">
      <div>
        <h1 class={`${ModulesStyles.titlePurpleDL} tablet:hidden`}>
          BITNAMES
        </h1>
        <h1 class={`${ModulesStyles.titlePurpleLD} hidden tablet:block`}>
          BITNAMES
        </h1>
      </div>
      {transactions.length > 0 && (
        <h2 class={ModulesStyles.subTitlePurple}>
          # {transactions[0].block_index}
        </h2>
      )}
      <div class="grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-3 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
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
