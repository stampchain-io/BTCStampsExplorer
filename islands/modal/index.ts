/* ===== MODALS ===== */
/* Not used in the codebase - @baba */
export * from "$islands/modal/ConnectWalletModal.tsx";
export * from "$islands/modal/PreviewImageModal.tsx";
export * from "$islands/modal/PreviewCodeModal.tsx";
export * from "$islands/modal/BuyStampModal.tsx";
export * from "$islands/modal/SendBTCModal.tsx";
export * from "$islands/modal/RecieveAddyModal.tsx";
export * from "$islands/modal/DonateStampModal.tsx";
export * from "$islands/modal/DetailSRC101Modal.tsx";

/* ===== MODAL LAYOUT - refactor ===== */
export * from "$components/layout/ModalLayout.tsx";

/* ===== MODAL STATES ===== */
export type {
  GlobalModalState,
  ModalAnimation,
  ModalConfig,
} from "$islands/modal/states.ts";
export {
  closeModal,
  DEFAULT_MODAL_ANIMATION,
  globalModal,
  openModal,
} from "$islands/modal/states.ts";

/*{ default as PreviewImageModal }*/
/* export * from "$islands/modal/SendStampModalWIP.tsx"; */
