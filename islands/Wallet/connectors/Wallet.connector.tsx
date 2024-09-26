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

type AddToastFunction = (message: string, type: string) => void;

export const WalletConnector = (
  { providerKey, toggleModal }: WalletConnectorProps,
) => {
  const { addToast } = useToast() ??
    { addToast: (() => {}) as AddToastFunction };
  const providerInfo = WALLET_PROVIDERS[providerKey];

  console.log(`Rendering wallet connector for ${providerKey}:`, providerInfo);

  const connectFunction = (() => {
    switch (providerKey) {
      case "unisat":
        return (toast: AddToastFunction) => unisatProvider.connectUnisat(toast);
      case "leather":
        return (toast: AddToastFunction) =>
          leatherProvider.connectLeather(toast);
      case "okx":
        return (toast: AddToastFunction) => okxProvider.connectOKX(toast);
      case "tapwallet":
        return (toast: AddToastFunction) =>
          tapWalletProvider.connectTapWallet(toast);
      case "phantom":
        return (toast: AddToastFunction) =>
          phantomProvider.connectPhantom(toast);
      default:
        return () => {};
    }
  })();

  const handleConnect = async () => {
    try {
      await connectFunction((message: string, type: string) => {
        addToast(message, type);
        console.log(message);
      });
      toggleModal();
      showConnectWalletModal.value = false; // Hide the modal after successful connection
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
      className="cursor-pointer flex items-center p-4 md:p-5 border rounded-lg border-gray-200 hover:border-gray-300 focus:border-gray-300 dark:border-[#8800CC] dark:hover:border-gray-500 dark:focus:border-gray-500 transition-colors ease-in-out duration-150"
    >
      <p className="text-md text-gray-200 uppercase md:text-base font-medium">
        {providerInfo.name}
      </p>
      <img
        src={providerInfo.logo.small}
        alt={providerInfo.name}
        className="w-8 h-8 ml-auto"
      />
    </div>
  );
};
