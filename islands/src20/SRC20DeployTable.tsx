import { SRC20Row } from "globals";
import { useState } from "preact/hooks";
import { convertToEmoji, short_address } from "utils/util.ts";

type SRC20BalanceTableProps = {
  data: SRC20Row[];
};

const ImageModal = ({ imgSrc, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      class="fixed z-20 inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <img class="w-60 h-60" src={imgSrc} alt="Modal" />
      </div>
    </div>
  );
};

export const SRC20DeployTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;

  const [modalImg, setModalImg] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageInteraction = (imgSrc) => {
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
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="bg-[#343434] uppercase text-xs text-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3">#</th>
              <th scope="col" class="px-6 py-3">img</th>
              <th scope="col" class="px-6 py-3">tick</th>
              <th scope="col" class="px-6 py-3">block</th>
              <th scope="col" class="px-6 py-3">creator</th>
              <th scope="col" class="px-6 py-3">max</th>
              <th scope="col" class="px-6 py-3">lim</th>
              <th scope="col" class="px-6 py-3">decimals</th>
              <th scope="col" class="px-6 py-3">date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((src20: SRC20Row) => {
              const href = `/src20/${convertToEmoji(src20.tick)}`;
              return (
                <tr class="bg-[#262424] border-b dark:border-gray-700">
                  <td class="px-6 py-4 uppercase">
                    {src20.row_num}
                  </td>
                  <td class="px-6 py-4 uppercase">
                    <img
                      src={`/content/${src20.tx_hash}.svg`}
                      class="w-10 h-10"
                      onClick={() =>
                        handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                    />
                  </td>
                  <td class="px-6 py-4 uppercase">
                    <a href={href}>
                      {convertToEmoji(src20.tick)}
                    </a>
                  </td>
                  <td class="px-6 py-4">
                    {src20.block_index}
                  </td>
                  <td class="px-6 py-4">
                    {src20.destination_name
                      ? src20.destination_name
                      : short_address(src20.destination)}
                  </td>
                  <td class="px-6 py-4">
                    {typeof src20.max === "number"
                      ? src20.max.toLocaleString()
                      : Number(src20.max).toLocaleString()}
                  </td>
                  <td class="px-6 py-4">
                    {typeof src20.lim === "number"
                      ? src20.lim.toLocaleString()
                      : Number(src20.lim).toLocaleString()}
                  </td>
                  <td class="px-6 py-4">
                    {src20.deci}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    {new Date(src20.block_time).toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
