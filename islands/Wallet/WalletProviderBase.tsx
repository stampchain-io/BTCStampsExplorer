import { useState } from "preact/hooks";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { unisatProvider } from "$client/wallet/unisat.ts";
import { useToast } from "$islands/Toast/ToastProvider.tsx";
import { leatherProvider } from "$client/wallet/leather.ts";
import { okxProvider } from "$client/wallet/okx.ts";
import { tapWalletProvider } from "$client/wallet/tapwallet.ts";
import { phantomProvider } from "$client/wallet/phantom.ts";
import { showConnectWalletModal } from "$client/wallet/wallet.ts";

interface WalletProviderBaseProps {
  providerKey: WalletProviderKey;
  toggleModal: () => void;
}

const walletConnectors = {
  unisat: unisatProvider.connectUnisat,
  leather: leatherProvider.connectLeather,
  okx: okxProvider.connectOKX,
  tapwallet: tapWalletProvider.connectTapWallet,
  phantom: phantomProvider.connectPhantom,
} as const;

export function WalletProviderBase(
  { providerKey, toggleModal }: WalletProviderBaseProps,
) {
  const { addToast = () => {} } = useToast() ?? {};
  const providerInfo = WALLET_PROVIDERS[providerKey];

  const [isHovered, setIsHovered] = useState(false);

  const handleConnect = async () => {
    try {
      const connectFunction = walletConnectors[providerKey];
      if (!connectFunction) {
        throw new Error(`Unsupported wallet provider: ${providerKey}`);
      }

      await connectFunction((message: string, type: string) => {
        addToast(message, type);
        console.log(message);
      });
      toggleModal();
      showConnectWalletModal.value = false;
    } catch (error) {
      const errorMessage =
        `Failed to connect to ${providerKey} wallet: ${error.message}`;
      addToast(errorMessage, "error");
      console.error(errorMessage);
    }
  };

  return (
    <div
      onClick={handleConnect}
      role="button"
      aria-label={`Connect to ${providerInfo.name}`}
      className="cursor-pointer flex justify-between items-center p-4 dark-gradient rounded-lg transition-colors ease-in-out duration-150 border-2 border-transparent hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p
        className={`text-xl mobileLg:text-2xl uppercase font-black ${
          isHovered ? "text-[#AA00FF]" : "purple-gradient3"
        }`}
      >
        {providerInfo.name}
      </p>
      <img
        src={providerInfo.logo.small}
        alt={providerInfo.name}
        className="w-8 h-8 mobileLg:w-10 mobileLg:h-10"
      />
    </div>
  );
}
