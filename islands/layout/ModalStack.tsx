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
        // First trigger the animation
        const modalContainer = document.getElementById(
          "animation-modal-container",
        );
        if (modalContainer) {
          modalContainer.classList.add("out");
        }

        // Then wait for animation and transform
        setTimeout(() => {
          if (onConnected) {
            onConnected();
          }
        }, 600);
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
