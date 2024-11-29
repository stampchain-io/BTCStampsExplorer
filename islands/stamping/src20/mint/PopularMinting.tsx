import { useEffect, useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";
import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";
import type { SRC20Row } from "globals";

export default function PopularMinting() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<SRC20Row[]>([]);

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        const response = await fetch(
          "/api/internal/src20/trending?limit=5&page=1&transactionCount=1000",
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

    fetchTrendingTokens();
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
        <h1 class={`${ModulesStyles.titlePurpleDL} tablet:hidden`}>
          TRENDING
        </h1>
        <h1 class={`hidden tablet:block ${ModulesStyles.titlePurpleLD}`}>
          TRENDING
        </h1>
      </div>
      <h2 class={ModulesStyles.subTitlePurple}>POPULAR TOKENS</h2>
      <div class="w-full flex flex-col gap-3 mobileMd:gap-6">
        {transactions.map((src20) => (
          src20.progress !== "100"
            ? (
              <SRC20TokenMintingCard
                key={src20.tick}
                src20={src20}
                variant="minting"
                onImageClick={() => {}}
              />
            )
            : (
              <SRC20TokenOutmintedCard
                key={src20.tick}
                src20={src20}
                variant="minting"
                onImageClick={() => {}}
              />
            )
        ))}
      </div>
    </div>
  );
}
