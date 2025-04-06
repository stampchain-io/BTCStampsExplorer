import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";

interface PropTypes {
  handleClose: () => void;
  img: string;
  name: string;
  owner: string;
}

const DetailModal = ({ handleClose, img, name, owner }: PropTypes) => {
  return (
    <ModalLayout onClose={handleClose} title={`${name}.btc`}>
      <div class="flex flex-col justify-center gap-1">
        <div class="w-full">
          <img src={img} class="" />
        </div>
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

export default DetailModal;
