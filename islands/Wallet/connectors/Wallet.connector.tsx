import { WALLET_PROVIDERS, WalletProviderKey } from "utils/constants.ts";
import { unisatProvider } from "store/wallet/unisat.ts";
import { useToast } from "$islands/Toast/ToastProvider.tsx";
import { leatherProvider } from "$lib/store/wallet/leather.ts";
import { okxProvider } from "$lib/store/wallet/okx.ts";
import { tapWalletProvider } from "$lib/store/wallet/tapwallet.ts";
import { phantomProvider } from "$lib/store/wallet/phantom.ts";
import { showConnectWalletModal } from "$lib/store/wallet/wallet.ts";

interface WalletConnectorProps {
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

export function WalletConnector(
  { providerKey, toggleModal }: WalletConnectorProps,
) {
  const { addToast = () => {} } = useToast() ?? {};
  const providerInfo = WALLET_PROVIDERS[providerKey];

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
      className="cursor-pointer flex justify-between items-center p-4 dark-gradient border rounded-lg border-[#8800CC] transition-colors ease-in-out duration-150 hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]"
    >
      <p className="gray-gradient4 text-2xl uppercase font-black">
        {providerInfo.name}
      </p>
      <img
        src={providerInfo.logo.small}
        alt={providerInfo.name}
        className="w-8 h-8"
      />
    </div>
  );
}
