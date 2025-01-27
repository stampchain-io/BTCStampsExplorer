import { useEffect, useState } from "preact/hooks";
import { MusicSection } from "$components/media/MusicSection.tsx";
import { walletContext } from "$client/wallet/wallet.ts";

interface StampifyPageProps {
  initialBalances: any[];
  error?: string | undefined;
}

export default function StampifyPage(
  { initialBalances, error: initialError }: StampifyPageProps,
) {
  const [balances, setBalances] = useState<any[]>(initialBalances);
  const [error, setError] = useState<string | undefined>(initialError);
  const { wallet, isConnected } = walletContext;

  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet.address) return;

      try {
        const response = await fetch(
          `/api/v2/src20/balance/${wallet.address}?includeMintData=true`,
        );
        const data = await response.json();
        setBalances(data.data);
        setError(undefined);
      } catch (err) {
        console.error("Error fetching balances:", err);
        setError("Failed to fetch balances");
      }
    };

    if (isConnected) {
      fetchBalances();
    }
  }, [wallet.address, isConnected]);

  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";

  return (
    <div class="flex flex-col gap-12 mobileLg:gap-24">
      <section>
        <h1 class={titleGreyDL}>STAMPIFY</h1>
        <h2 class={subTitleGrey}>YOUR MUSIC COLLECTION</h2>

        {/* Wallet Connection Status */}
        {!isConnected
          ? (
            <div class="mt-8 p-4 bg-stamp-card-bg text-stamp-grey-light rounded-lg">
              Please connect your wallet to access your music collection.
            </div>
          )
          : (
            <>
              {error && (
                <div class="mt-4 p-4 bg-red-900/20 text-red-300 rounded-lg">
                  {error}
                </div>
              )}

              {/* Display Music Section if we have balances */}
              {balances && balances.length > 0 && (
                <div class="mt-8">
                  <MusicSection balances={balances} />
                </div>
              )}

              {balances && balances.length === 0 && (
                <div class="mt-8 p-4 bg-stamp-card-bg text-stamp-grey-light rounded-lg">
                  No SRC20 tokens found in your wallet. You need to own specific
                  tokens to access music.
                </div>
              )}
            </>
          )}
      </section>
    </div>
  );
}
