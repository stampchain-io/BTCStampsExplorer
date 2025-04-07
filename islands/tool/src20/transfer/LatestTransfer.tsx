import { useEffect, useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { StampTransaction } from "$lib/types/stamping.ts";
import type { JSX } from "preact";

export default function LatestTransfer(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const response = await fetch(
          "/api/internal/src20/trending?type=transfer&limit=5&page=1&transactionCount=1000",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recent transactions");
        }
        const data = await response.json();
        setTransactions(data.data || []);
      } catch (error) {
        console.error("Error fetching recent transfers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  if (isLoading) {
    return <div class="animate-pulse">Loading recent transfers...</div>;
  }

  return (
    <div class="flex flex-col items-start tablet:items-end">
      <h1 class={`${ModulesStyles.titlePurpleDL} tablet:hidden`}>
        RECENT TRANSFERS
      </h1>
      <h1 class={`hidden tablet:block ${ModulesStyles.titlePurpleLD}`}>
        RECENT TRANSFERS
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
            stamp={stamp.stamp_url
              ? stamp
              : {
                ...stamp,
                stamp_url: `https://stampchain.io/stamps/${stamp.tx_hash}.svg`,
              }}
            isRecentSale={false}
            showDetails={false}
          />
        ))}
      </div>
    </div>
  );
}
