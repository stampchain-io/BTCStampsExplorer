import { useEffect, useState } from "preact/hooks";
import { StampCard } from "$islands/stamp/StampCard.tsx";
import type { StampTransaction } from "$lib/types/stamping.ts";
import type { JSX } from "preact";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

export default function RecentDeploy(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const response = await fetch(
          "/api/internal/src20/trending?type=deploy&limit=5&page=1&transactionCount=1000",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recent transactions");
        }
        const data = await response.json();
        setTransactions(data.data || []);
      } catch (error) {
        console.error("Error fetching recent deploys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  if (isLoading) {
    return <div class="animate-pulse">Loading recent deploys...</div>;
  }

  return (
    <div class="flex flex-col items-start tablet:items-end">
      <div>
        <h4 class={`${titlePurpleLD} tablet:hidden`}>
          RECENT DEPLOYS
        </h4>
        <h4 class={`hidden tablet:block ${titlePurpleDL}`}>
          RECENT DEPLOYS
        </h4>
      </div>
      {transactions.length > 0 && (
        <h3 class={subtitlePurple}>
          BLOCK #{transactions[0].block_index}
        </h3>
      )}
      <div class="grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-3 desktop:grid-cols-4 gap-6">
        {transactions.map((stamp, index) => (
          <StampCard
            key={index}
            stamp={stamp.stamp_url ? stamp : {
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
