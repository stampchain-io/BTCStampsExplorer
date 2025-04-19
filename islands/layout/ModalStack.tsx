import { WalletProvider } from "$islands/layout/WalletProvider.tsx";
import { ConnectWalletModal } from "$islands/modal/ConnectWalletModal.tsx";
import { DEFAULT_WALLET_CONNECTORS } from "$lib/utils/constants.ts";
import { closeForegroundModal } from "$islands/modal/states.ts";

export const stackConnectWalletModal = (onConnected?: () => void) => {
  const connectors = DEFAULT_WALLET_CONNECTORS;

  const providerComponents = connectors.map((key) => (
    <WalletProvider
      key={key}
      providerKey={key}
      onSuccess={() => {
        if (onConnected) {
          onConnected();
        }
      }}
    />
  ));

  const modalContent = (
    <ConnectWalletModal
      connectors={providerComponents}
      handleClose={closeForegroundModal}
    />
  );

  return { modalContent };
};
