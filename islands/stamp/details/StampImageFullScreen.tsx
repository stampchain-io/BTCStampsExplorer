import { handleImageError } from "$lib/utils/imageUtils.ts";

interface StampImageFullScreenProps {
  src: string;
  toggleModal: () => void;
  handleCloseModal: () => void;
  typeFlag: number;
}

const StampImageFullScreen = (
  { src, toggleModal, handleCloseModal, typeFlag }: StampImageFullScreenProps,
) => {
  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-[800px] h-auto">
        <div class="relative bg-white rounded-lg shadow overflow-hidden">
          <div class="flex flex-col gap-4 items-center justify-between p-4 tablet:p-5 rounded-t">
            {typeFlag === 1 && (
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                className={`aspect-square rounded-lg`}
                sandbox="allow-scripts allow-same-origin"
                src={src}
                loading="lazy"
                title="Stamp"
              />
            )}
            {typeFlag === 2 && (
              <img
                width="100%"
                loading="lazy"
                className={`max-w-none object-contain rounded-lg pixelart stamp-image`}
                src={src}
                onError={handleImageError}
                alt="Stamp"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampImageFullScreen;
