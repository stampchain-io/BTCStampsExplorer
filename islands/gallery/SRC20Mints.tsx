import { useEffect, useState } from "preact/hooks";
import type { SRC20Row } from "$globals";
import { SRC20CardMinted, SRC20CardMinting } from "$card";
import { subtitlePurple, titlePurpleDL, titlePurpleLD } from "$text";

export default function SRC20MintsGallery() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SRC20Row[]>([]);

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

  if (isLoading) {
    return <div class="animate-pulse">Loading trending tokens...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div></div>;
  }

  return (
    <div class="flex flex-col items-start tablet:items-end">
      <div>
        <h4 class={`${titlePurpleLD} tablet:hidden`}>
          TRENDING
        </h4>
        <h4 class={`hidden tablet:block ${titlePurpleDL}`}>
          TRENDING
        </h4>
      </div>
      <h3 class={subtitlePurple}>POPULAR TOKENS</h3>
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
              <SRC20CardMinted
                key={src20.tick}
                src20={src20}
                fromPage="stamping/src20"
                onImageClick={() => {}}
              />
            )
        ))}
      </div>
    </div>
  );
}
