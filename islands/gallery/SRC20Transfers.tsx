/* ===== SRC20 RECENT TRANSFERS GALLERY COMPONENT ===== */
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { StampTransaction } from "$lib/types/stamping.ts";
import { StampCard } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
export default function SRC20TransfersGallery(): JSX.Element {
  /* ===== STATE ===== */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  /* ===== EFFECTS ===== */
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

  /* ===== LOADING STATE ===== */
  if (isLoading) {
    return <div class="animate-pulse">Loading recent transfers...</div>;
  }

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col items-start tablet:items-end">
      {/* ===== TITLE SECTION ===== */}
      <h4 class={`${titlePurpleLD} tablet:hidden`}>
        RECENT TRANSFERS
      </h4>
      <h4 class={`hidden tablet:block ${titlePurpleDL}`}>
        RECENT TRANSFERS
      </h4>
      {transactions.length > 0 && (
        <h3 class={subtitlePurple}>
          BLOCK #{transactions[0].block_index}
        </h3>
      )}
      {/* ===== STAMPS GRID SECTION ===== */}
      <div class="grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-6">
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
