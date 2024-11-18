import { ViewAllButton } from "$components/ViewAllButton.tsx";
import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { SRC20TokenMintingCard } from "$islands/src20/cards/SRC20TokenMintingCard.tsx";
import { SRC20TokenOutmintedCard } from "$islands/src20/cards/SRC20TokenOutmintedCard.tsx";

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

export const SRC20DeployTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => setModalOpen(false);
  const handleImageClick = (imgSrc: string) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  return (
    <div className="max-w-desktop w-full mx-auto px-3 tablet:px-6 desktop:px-12">
      <ImageModal
        imgSrc={modalImg}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <div class="flex flex-col gap-6">
        {data.map((src20) => (
          src20.progress !== "100"
            ? (
              <SRC20TokenMintingCard
                src20={src20}
                variant="deploy"
                onImageClick={handleImageClick}
              />
            )
            : (
              <SRC20TokenOutmintedCard
                src20={src20}
                variant="deploy"
                onImageClick={handleImageClick}
              />
            )
        ))}
      </div>

      {/* ViewAllButton aligned right */}
      <div className="flex justify-end">
        <ViewAllButton href="/src20" />
      </div>
    </div>
  );
};
