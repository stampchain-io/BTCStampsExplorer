/* ===== SRC20 RECENT DEPLOYS GALLERY COMPONENT ===== */
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { StampTransaction } from "$lib/types/stamping.ts";
import { StampCard } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
export default function SRC20DeploysGallery(): JSX.Element {
  /* ===== STATE ===== */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  /* ===== EFFECTS ===== */
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

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full items-start tablet:items-end">
      {/* ===== TITLE SECTION ===== */}
      <div class="w-full">
        <h4 class={`${titlePurpleLD} tablet:hidden`}>
          RECENT DEPLOYS
        </h4>
        <h4 class={`hidden tablet:block w-full text-right ${titlePurpleDL}`}>
          RECENT DEPLOYS
        </h4>
      </div>

      {/* Show block title with loading state */}
      <h3 class={`w-full text-right ${subtitlePurple}`}>
        {isLoading ? <span class="animate-pulse">BLOCK #XXX,XXX</span> : (
          transactions.length > 0 && `BLOCK #${transactions[0].block_index}`
        )}
      </h3>

      {/* ===== LOADING OR CONTENT ===== */}
      {isLoading
        ? (
          <div class="w-full grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-3 desktop:grid-cols-4 gap-6">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                class="loading-skeleton running aspect-square rounded"
              />
            ))}
          </div>
        )
        : (
          <div class="w-full grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-3 desktop:grid-cols-4 gap-6">
            {transactions.map((stamp, index) => (
              <StampCard
                key={index}
                stamp={stamp.stamp_url ? stamp : {
                  ...stamp,
                  stamp_url:
                    `https://stampchain.io/stamps/${stamp.tx_hash}.svg`,
                }}
                isRecentSale={false}
                showDetails={false}
              />
            ))}
          </div>
        )}
    </div>
  );
}
