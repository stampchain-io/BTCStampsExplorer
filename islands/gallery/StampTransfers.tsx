import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { StampTransaction } from "$lib/types/stamping.ts";
import { StampCard } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

export default function StampTransfersGallery(): JSX.Element {
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
        setTransactions(data.transfer || []);
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
      <h3 class={`tablet:hidden ${titlePurpleLD}`}>
        STAMP TRANSFERS
      </h3>
      <h3 class={`hidden tablet:block ${titlePurpleDL}`}>
        STAMP TRANSFERS
      </h3>
      {transactions.length > 0 && (
        <h4 class={subtitlePurple}>
          BLOCK #{transactions[0].block_index}
        </h4>
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
