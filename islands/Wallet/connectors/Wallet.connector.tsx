import { WALLET_PROVIDERS, WalletProviderKey } from "utils/constants.ts";
import { connectUnisat } from "store/wallet/unisat.ts";
import { useToast } from "$islands/Toast/toast.tsx";
import { leatherProvider } from "$lib/store/wallet/leather.ts";
import { okxProvider } from "$lib/store/wallet/okx.ts";

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

  console.log(`Rendering wallet connector for ${providerKey}:`, providerInfo); // Add this line

  const connectFunction = providerKey === "unisat"
    ? connectUnisat
    : providerKey === "leather"
    ? (toast: AddToastFunction) => leatherProvider.connectLeather(toast)
    : providerKey === "okx"
    ? (toast: AddToastFunction) => okxProvider.connectOKX(toast)
    : () => {};

  const handleConnect = async () => {
    try {
      await connectFunction((message: string, type: string) => {
        addToast(message, type);
        console.error(message);
      });
      toggleModal();
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
      className="cursor-pointer flex items-center p-4 md:p-5 border rounded-lg border-gray-200 hover:border-gray-300 focus:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:focus:border-gray-500 transition-colors ease-in-out duration-150"
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
