/* ===== SRC20 RECENT MINTS GALLERY COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import type { SRC20Row } from "$globals";
import { SRC20Card, SRC20CardMinting } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
export default function SRC20MintsGallery() {
  /* ===== STATE ===== */
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SRC20Row[]>([]);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    const fetchTrendingActiveMintingTokens = async () => {
      try {
        const response = await fetch(
          // Use the consolidated trending endpoint with type=minting
          "/api/internal/src20/trending?type=minting&limit=5&page=1&transactionCount=1000",
        );
        if (!response.ok) throw new Error("Failed to fetch trending tokens");
        const data = await response.json();
        setTransactions(data.data);
      } catch (error) {
        console.error("Error fetching trending tokens:", error);
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
        : (
          <div class="w-full flex flex-col gap-6">
            {transactions.map((src20) => (
              src20.progress !== "100"
                ? (
                  <SRC20CardMinting
                    key={src20.tick}
                    src20={src20}
                    fromPage="stamping/src20"
                    onImageClick={() => {}}
                  />
                )
                : (
                  <SRC20Card
                    key={src20.tick}
                    src20={src20}
                    fromPage="stamping/src20"
                    onImageClick={() => {}}
                  />
                )
            ))}
          </div>
        )}
    </div>
  );
}
