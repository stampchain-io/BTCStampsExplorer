/* ===== WALLET PROVIDER MODAL COMPONENT ===== */
import { useState } from "preact/hooks";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { unisatProvider } from "$client/wallet/unisat.ts";
import { useToast } from "$islands/Toast/ToastProvider.tsx";
import { leatherProvider } from "$client/wallet/leather.ts";
import { okxProvider } from "$client/wallet/okx.ts";
import { tapWalletProvider } from "$client/wallet/tapwallet.ts";
import { phantomProvider } from "$client/wallet/phantom.ts";
import { showConnectWalletModal } from "$client/wallet/wallet.ts";
import { containerCard } from "$layout";

/* ===== TYPES ===== */
interface WalletProviderProps {
  providerKey: WalletProviderKey;
  toggleModal: () => void;
}

/* ===== WALLET CONNECTORS CONFIG ===== */
const walletConnectors = {
  unisat: unisatProvider.connectUnisat,
  leather: leatherProvider.connectLeather,
  okx: okxProvider.connectOKX,
  tapwallet: tapWalletProvider.connectTapWallet,
  phantom: phantomProvider.connectPhantom,
} as const;

/* ===== MODAL COMPONENT ===== */
export function WalletProvider(
  { providerKey, toggleModal }: WalletProviderProps,
) {
  /* ===== HOOKS ===== */
  const { addToast = () => {} } = useToast() ?? {};
  const providerInfo = WALLET_PROVIDERS[providerKey];

  /* ===== STATE ===== */
  const [isHovered, setIsHovered] = useState(false);

  /* ===== EVENT HANDLERS ===== */
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

  /* ===== RENDER ===== */
  return (
    <div
      onClick={handleConnect}
      role="button"
      aria-label={`Connect to ${providerInfo.name}`}
      className={`flex justify-between items-center p-4 ${containerCard}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== PROVIDER NAME ===== */}
      <h6
        className={`font-extrabold text-lg uppercase tracking-wide ${
          isHovered ? "text-stamp-purple-bright" : "gray-gradient3"
        }`}
      >
        {providerInfo.name}
      </h6>

      {/* ===== PROVIDER LOGO ===== */}
      <img
        src={providerInfo.logo.small}
        alt={providerInfo.name}
        className="w-8 h-8"
      />
    </div>
  );
}
