import { useEffect, useState } from "preact/hooks";
import { StampRow } from "globals";
import { useFeePolling } from "hooks/useFeePolling.tsx";
import StampImage from "./StampImage.tsx";

interface StampImageFullScreenProps {
  src: string;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

const StampImageFullScreen = (
  { src, toggleModal, handleCloseModal }: StampImageFullScreenProps,
) => {
  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-[800px] h-auto">
        <div class="relative bg-white rounded-lg shadow overflow-hidden">
          <div class="flex flex-col gap-4 items-center justify-between p-4 md:p-5 rounded-t">
            <button
              onClick={toggleModal}
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="default-modal"
            >
              <svg
                class="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
            <img
              width="100%"
              loading="lazy"
              className={`mx-10 md:mx-0 max-w-none object-contain rounded-lg pixelart stamp-image`}
              src={src}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/content/not-available.png";
              }}
              alt="Stamp"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampImageFullScreen;
