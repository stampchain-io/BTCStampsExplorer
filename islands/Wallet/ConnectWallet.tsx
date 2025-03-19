// connectWallet.tsx
import { WalletModal } from "$islands/Wallet/WalletModal.tsx";
import { WalletConnector } from "$islands/Wallet/connectors/Wallet.connector.tsx";
import { WalletProviderKey } from "$lib/utils/constants.ts";

export function ConnectWallet() {
  const connectors: WalletProviderKey[] = ["unisat", "leather", "okx"];
  return (
    <WalletModal
      connectors={connectors.map((key) => (extraProps: any) => (
        <WalletConnector providerKey={key} {...extraProps} />
      ))}
    />
  );
}
