/* ===== SRC20 RECENT MINTS GALLERY COMPONENT ===== */
import { SRC20CardSmMinting } from "$card";
import type { SRC20Row } from "$globals";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";
import { useEffect, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export default function SRC20MintsGallery() {
  /* ===== STATE ===== */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SRC20Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    const fetchTrendingActiveMintingTokens = async () => {
      try {
        const response = await fetch(
          "/api/internal/src20/trending?type=minting&limit=5&page=1&transactionCount=1000",
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch trending tokens: ${response.status}`,
          );
        }

        const data = await response.json();
        setTransactions(data.data || []);
        setError(null);
      } catch (error) {
        console.error("Error fetching trending tokens:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingActiveMintingTokens();
  }, []);

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col w-full items-start tablet:items-end">
      {/* ===== TITLE SECTION ===== */}
      <div class="w-full">
        <h4 class={`${titlePurpleLD} tablet:hidden`}>
          TRENDING
        </h4>
        <h4 class={`hidden tablet:block w-full text-right ${titlePurpleDL}`}>
          TRENDING
        </h4>
      </div>
      <h3 class={`w-full text-right ${subtitlePurple}`}>
        {isLoading ? <span class="animate-pulse">POPULAR TOKENS</span> : (
          "POPULAR TOKENS"
        )}
      </h3>

      {/* ===== LOADING OR CONTENT ===== */}
      {isLoading
        ? (
          <div class="w-full flex flex-col gap-6">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                class="loading-skeleton running w-full h-12 rounded"
              />
            ))}
          </div>
        )
        : error
        ? (
          <div class="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p class="font-bold">Error loading trending tokens:</p>
            <p class="text-sm">{error}</p>
          </div>
        )
        : transactions.length === 0
        ? (
          <div class="text-stamp-grey-darkest text-sm">
            No trending tokens found
          </div>
        )
        : (
          <SRC20CardSmMinting
            data={transactions}
            fromPage="stamping/src20"
            timeframe="24H"
            onImageClick={() => {}}
          />
        )}
    </div>
  );
}
