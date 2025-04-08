/* ===== SRC101 DETAIL MODAL COMPONENT ===== */
import { ModalLayout } from "$components/modal/ModalLayout.tsx";

/* ===== TYPES ===== */
interface PropTypes {
  handleClose: () => void;
  img: string;
  name: string;
  owner: string;
}

/* ===== COMPONENT ===== */
const DetailSRC101Modal = ({ handleClose, img, name, owner }: PropTypes) => {
  /* ===== RENDER ===== */
  return (
    <ModalLayout onClose={handleClose} title={`${name}.btc`}>
      <div class="flex flex-col justify-center gap-1">
        {/* ===== IMAGE SECTION ===== */}
        <div class="w-full">
          <img src={img} class="" />
        </div>

        {/* ===== DETAILS SECTION ===== */}
        <div class="w-full flex flex-col gap-1">
          <div class="flex gap-2">
            <span class="text-stamp-grey-darker text-lg">Name</span>
            <span class="text-white text-xl">{name}</span>
          </div>
          <div class="flex gap-2">
            <span class="text-stamp-grey-darker text-lg">Owner</span>
            <span class="text-white text-xl truncate">{owner}</span>
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};

export default DetailSRC101Modal;
