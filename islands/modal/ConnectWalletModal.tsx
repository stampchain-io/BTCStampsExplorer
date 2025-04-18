/* ===== CONNECT WALLET MODAL COMPONENT ===== */
import { ComponentChildren } from "preact";
import { showConnectWalletModal } from "$client/wallet/wallet.ts";
import { subtitlePurple } from "$text";
import { ModalBase } from "$layout";
import { logger } from "$lib/utils/logger.ts";

/* ===== TYPES ===== */
interface ConnectWalletModalProps {
  connectors: ComponentChildren;
  handleClose: () => void;
}

/* ===== COMPONENT ===== */
export const ConnectWalletModal = ({
  connectors,
  handleClose,
}: ConnectWalletModalProps) => {
  /* ===== EVENT HANDLERS ===== */
  const handleModalClose = () => {
    logger.debug("ui", {
      message: "Connect wallet modal closing",
      component: "ConnectWalletModal",
    });

    // First trigger the animation
    const modalContainer = document.getElementById("animation-modal-container");
    if (modalContainer) {
      modalContainer.classList.add("out");
    }

    // Then wait for animation to complete before closing
    setTimeout(() => {
      showConnectWalletModal.value = false;
      handleClose();
    }, 600); // matches --animation-cleanup-delay from modal.css
  };

  /* ===== RENDER ===== */
  return (
    <ModalBase
      title="CONNECT"
      onClose={handleModalClose}
      className="w-[340px] mobileLg:w-[640px]"
    >
      <h4 class={`${subtitlePurple} text-center -mt-9 pb-3`}>
        YOUR WALLET
      </h4>

      {/* ===== WALLET PROVIDERS GRID ===== */}
      <div class="grid grid-cols-1 mobileLg:grid-cols-2 gap-6 items-center">
        {connectors}
      </div>
    </ModalBase>
  );
};
