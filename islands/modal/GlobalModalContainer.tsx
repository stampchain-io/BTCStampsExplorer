import { Fragment } from "preact";
import { closeModal, globalModal } from "$islands/modal/states.ts";
import ModalOverlay from "$islands/modal/ModalOverlay.tsx";

export default function GlobalModalContainer() {
  // Debug logging
  console.log("GlobalModalContainer rendering:", globalModal.value);

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
