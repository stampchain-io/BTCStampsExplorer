import { ModulesStyles } from "$islands/modules/Styles.ts";
import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";
import type { SRC20MintingProps } from "$lib/types/stamping.ts";
import type { JSX } from "preact";

export default function PopularMinting(
  { transactions }: SRC20MintingProps,
): JSX.Element {
  if (!transactions || transactions.length === 0) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-start tablet:items-end">
      <h1 class={`${ModulesStyles.titlePurpleDLClassName} tablet:hidden`}>
        TRENDING
      </h1>
      <h1 class={`hidden tablet:block ${ModulesStyles.titlePurpleLDClassName}`}>
        TRENDING
      </h1>
      <h2 className={ModulesStyles.subTitlePurple}>POPULAR TOKENS</h2>
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
