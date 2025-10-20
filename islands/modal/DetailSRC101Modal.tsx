/* ===== SRC101 DETAIL MODAL COMPONENT ===== */
import { ModalBase } from "$layout";
import type { DetailSRC101ModalProps } from "$types/ui.d.ts";
import { closeModal } from "$islands/modal/states.ts";
import { logger } from "$lib/utils/logger.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
const DetailSRC101Modal = ({ img, name, owner }: DetailSRC101ModalProps) => {
  const handleCloseModal = () => {
    logger.debug("ui", {
      message: "Modal closing",
      component: "DetailSRC101Modal",
    });
    closeModal();
  };

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={handleCloseModal}
      title={`${name}.btc`}
    >
      <div class="flex flex-col justify-center gap-1">
        {/* ===== IMAGE SECTION ===== */}
        <div class="w-full">
          <img src={img} class="" />
        </div>

        {/* ===== DETAILS SECTION ===== */}
        <div class="w-full flex flex-col gap-1">
          <div class="flex gap-2">
            <span class="font-light text-color-neutral-semidark text-sm">
              NAME
            </span>
            <span class="font-bold text-color-neutral-light text-lg">
              {name}
            </span>
          </div>
          <div class="flex gap-2">
            <span class="font-light text-color-neutral-semidark text-sm">
              OWNER
            </span>
            <span class="font-bold text-color-neutral-light text-lg truncate">
              {owner}
            </span>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export default DetailSRC101Modal;
