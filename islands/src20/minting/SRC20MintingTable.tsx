import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import SRC20MintingItem from "$islands/src20/minting/SRC20MintingItem.tsx";

type SRC20BalanceTableProps = {
  data: SRC20Row[];
};

const ImageModal = (
  { imgSrc, isOpen, onClose }: {
    imgSrc: string | null;
    isOpen: boolean;
    onClose: () => void;
  },
) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      class="fixed z-20 inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div onClick={(e) => e.stopPropagation()}>
        {imgSrc && <img class="w-60 h-60" src={imgSrc} alt="Modal" />}
      </div>
    </div>
  );
};

export const SRC20MintingTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;
  console.log("SRC20MintingTable received data:", data);

  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageInteraction = (imgSrc: string) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  return (
    <>
      <ImageModal
        imgSrc={modalImg}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <div class="relative overflow-x-auto shadow-md">
        <div class="flex flex-col gap-3 md:gap-6">
          {data.map((src20: SRC20Row) => {
            return (
              <SRC20MintingItem
                src20={src20}
                handleImageInteraction={handleImageInteraction}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};
