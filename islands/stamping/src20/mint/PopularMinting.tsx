import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";

const PopularMinting = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const titlePurpleDLClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";
  const titlePurpleLDClassName =
    "text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3";
  const subTitlePurpleClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-purple-highlight mb-1.5 mobileLg:mb-3";

  return (
    <div className="flex flex-col items-start tablet:items-end">
      <h1 class={`${titlePurpleDLClassName} tablet:hidden`}>TRENDING</h1>
      <h1 class={`hidden tablet:block ${titlePurpleLDClassName}`}>TRENDING</h1>
      <h2 className={subTitlePurpleClassName}>POPULAR TOKENS</h2>
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
};

export default PopularMinting;
