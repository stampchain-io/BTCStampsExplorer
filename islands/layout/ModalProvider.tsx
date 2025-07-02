import { Fragment } from "preact";
import { closeModal, globalModal } from "$islands/modal/states.ts";
import ModalOverlay from "$islands/layout/ModalOverlay.tsx";

export default function ModalProvider() {
  // Debug logging
  // Development-only logging
  if (globalThis.location?.hostname === "localhost") {
    console.log(
      "ModalProvider rendering with globalModal.value:",
      globalModal.value,
    );
  }

  return (
    <Fragment>
      {globalModal.value.isOpen && globalModal.value.content && (
        <ModalOverlay
          handleClose={closeModal}
          animation={globalModal.value.animation}
        >
          {globalModal.value.content}
        </ModalOverlay>
      )}
    </Fragment>
  );
}
