import { SRC20Row } from "globals";
import { useCallback, useEffect, useState } from "preact/hooks";
import { abbreviateAddress, convertToEmoji } from "$lib/utils/util.ts";

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

export const UploadImageTable = (props: SRC20BalanceTableProps) => {
  const { data } = props;

  const [modalImg, setModalImg] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [wallet, setWallet] = useState(null);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleImageInteraction = (imgSrc) => {
    setModalImg(imgSrc);
    setModalOpen(!isModalOpen);
  };

  const getAccount = () => {
    setWallet(JSON.parse(localStorage.getItem("wallet") as any));
    // setWallet({ address: "bc1qqz5tvzm3uw3w4lruga8aylsk9fs93y0w8fysfe" });
  };

  useEffect(() => {
    const interval = setInterval(() => getAccount(), 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <ImageModal
        imgSrc={modalImg}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      {wallet
        ? (
          <div class="relative overflow-x-auto shadow-md mobile-768:rounded-lg">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                SRC20
              </caption>
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
                {data.filter((row) => row.creator === wallet.address).map(
                  // data.map(
                  (src20: SRC20Row) => {
                    const href = `/upload/${convertToEmoji(src20.tick)}`;
                    return (
                      <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <td class="px-6 py-4 uppercase">
                          {src20.row_num}
                        </td>
                        <td class="px-6 py-4 uppercase">
                          <img
                            src={`/content/${src20.tx_hash}.svg`}
                            class="w-10 h-10"
                            onClick={() =>
                              handleImageInteraction(
                                `/content/${src20.tx_hash}.svg`,
                              )}
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
                          {src20.creator
                            ? src20.creator
                            : abbreviateAddress(src20.creator)}
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
                          {new Date(src20.block_time).toLocaleString(
                            "default",
                            {
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )
        : (
          <div className={"text-white text-center text-3xl"}>
            Please connect your wallet to see your stamps
          </div>
        )}
    </>
  );
};
