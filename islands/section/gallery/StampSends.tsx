/* ===== STAMP RECENT TRANSFERS GALLERY COMPONENT ===== */
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { StampTransaction } from "$lib/types/stamping.ts";
import { StampCard } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
export default function StampSendsGallery(): JSX.Element {
  /* ===== STATE ===== */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<StampTransaction[]>([]);

  /* ===== EFFECTS ===== */
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

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full items-start tablet:items-end">
      {/* ===== TITLE SECTION ===== */}
      <div class="w-full">
        <h3 class={`${titlePurpleLD} tablet:hidden`}>
          STAMP TRANSFERS
        </h3>
        <h3 class={`hidden tablet:block w-full text-right ${titlePurpleDL}`}>
          STAMP TRANSFERS
        </h3>
      </div>

      {/* Show block title with loading state */}
      <h4 class={`w-full text-right ${subtitlePurple}`}>
        {isLoading ? <span class="animate-pulse">BLOCK #XXX,XXX</span> : (
          transactions.length > 0 && `BLOCK #${transactions[0].block_index}`
        )}
      </h4>

      {/* ===== LOADING OR CONTENT ===== */}
      {isLoading
        ? (
          <div class="w-full grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                class="loading-skeleton running aspect-square rounded"
              />
            ))}
          </div>
        )
        : (
          <div class="w-full grid grid-cols-4 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-4 desktop:grid-cols-4 gap-3 mobileMd:gap-6">
            {transactions.map((stamp, index) => (
              <StampCard
                key={index}
                stamp={stamp}
                isRecentSale={false}
                showDetails={false}
              />
            ))}
          </div>
        )}
    </div>
  );
}
