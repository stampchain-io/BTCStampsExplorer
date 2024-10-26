// connectWallet.tsx
import { WalletModal } from "./WalletModal.tsx";
import { WalletConnector } from "./connectors/Wallet.connector.tsx";
import { WalletProviderKey } from "$lib/utils/constants.ts";

export function ConnectWallet({ toggleModal }: { toggleModal: () => void }) {
  const connectors: WalletProviderKey[] = ["unisat", "leather", "okx"];

  return (
    <WalletModal
      connectors={connectors.map((key) => (extraProps: any) => (
        <WalletConnector providerKey={key} {...extraProps} />
      ))}
      toggleModal={toggleModal}
    />
  );
}
