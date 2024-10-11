import { StampCard } from "$islands/stamp/StampCard.tsx";
import StampingMintingItem from "$islands/stamping/src20/mint/StampingMintingItem.tsx";

interface WalletContentProps {
  stamps: any[];
  src20: any[];
}

function WalletContent({ stamps, src20 }: WalletContentProps) {
  return (
    <>
      <div className="grid grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
        {stamps.map((stamp, index) => (
          <StampCard
            key={index}
            stamp={stamp}
            kind="stamp"
            isRecentSale={false}
            showInfo={true}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        {src20.map((src20Item, index) => (
          <StampingMintingItem
            key={index}
            src20={src20Item}
          />
        ))}
      </div>
    </>
  );
}

export default WalletContent;
