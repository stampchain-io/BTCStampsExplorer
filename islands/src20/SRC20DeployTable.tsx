import { useState } from "preact/hooks";

import { SRC20Row } from "globals";

import { abbreviateAddress, convertToEmoji } from "utils/util.ts";

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
  console.log("SRC20DeployTable received data:", data);

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
        <div class="hidden md:flex flex-col gap-6">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            return (
              <div class="bg-gradient-to-br from-[#0A000F00] via-[#14001FFF] to-[#1F002EFF] text-sm flex justify-between rounded-md">
                <div class="p-3 uppercase cursor-pointer flex gap-6">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[65px] h-[65px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />
                  <div className={"flex flex-col justify-between"}>
                    <a
                      href={href}
                      className={"text-2xl text-[#666666] font-bold"}
                    >
                      {convertToEmoji(src20.tick)}
                    </a>
                    <p className={"text-lg text-[#666666] font-light"}>
                      CREATOR{" "}
                      <span className={"font-bold text-[#999999]"}>
                        {src20.destination_name
                          ? src20.destination_name
                          : abbreviateAddress(src20.destination)}
                      </span>
                    </p>
                  </div>
                </div>
                <div class="p-3 text-center flex flex-col justify-center">
                  <p className={"text-lg text-[#666666] font-light"}>
                    SUPPLY{" "}
                    <span className={"font-bold text-[#999999]"}>
                      {typeof src20.max === "number"
                        ? src20.max.toLocaleString()
                        : Number(src20.max).toLocaleString()}
                    </span>
                  </p>
                  <p className={"text-lg text-[#666666] font-light"}>
                    LIMIT{" "}
                    <span className={"font-bold text-[#999999]"}>
                      {typeof src20.lim === "number"
                        ? src20.lim.toLocaleString()
                        : Number(src20.lim).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div class="p-3 text-sm text-center flex flex-col justify-center">
                  <p className={"text-lg text-[#666666] font-light"}>
                    DEPLOY{" "}
                    <span className={"font-bold text-[#999999]"}>
                      {new Date(src20.block_time).toLocaleString("default", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  <p className={"text-lg text-[#666666] font-light"}>
                    HOLDERS{" "}
                    <span className={"font-bold text-[#999999]"}>2170</span>
                  </p>
                </div>
                <div class="p-3 text-right flex flex-col justify-center">
                  <p className={"text-lg text-[#666666] font-light"}>
                    MARKETCAP{" "}
                    <span className={"font-bold text-[#999999]"}>
                      93.15 BTC
                    </span>
                  </p>
                  <p className={"text-lg text-[#666666] font-light"}>
                    PRICE{" "}
                    <span className={"font-bold text-[#999999]"}>
                      13.50 SATS
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div class="flex md:hidden flex-col gap-3">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            return (
              <div class="text-[#F5F5F5] bg-[#2B0E49] border-2 border-[#3F2A4E] p-2">
                <div class="w-full flex items-center gap-2 mb-2">
                  <img
                    src={`/content/${src20.tx_hash}.svg`}
                    class="w-[74px] h-[74px] rounded-[3px]"
                    onClick={() =>
                      handleImageInteraction(`/content/${src20.tx_hash}.svg`)}
                  />
                  <div class="w-full">
                    <div class="flex justify-between">
                      <a href={href} class="text-xl">
                        {convertToEmoji(src20.tick)}
                      </a>
                      <p class="text-sm">
                        {new Date(src20.block_time).toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p>
                      Block:{" "}
                      <span class="text-lg font-medium">
                        {src20.block_index}
                      </span>
                    </p>
                    <div class="flex justify-between">
                      <p>
                        Creator:{" "}
                        <span class="text-lg font-medium">
                          {src20.destination_name
                            ? src20.destination_name
                            : abbreviateAddress(src20.destination)}
                        </span>
                      </p>
                      <p class="text-sm">
                        {Number(src20.deci)?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="w-full flex justify-between pr-6">
                  <div>
                    <p>Max:</p>
                    <p class="text-lg">
                      {typeof src20.max === "number"
                        ? src20.max.toLocaleString()
                        : Number(src20.max).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p>Lim:</p>
                    <p class="text-lg">
                      {typeof src20.lim === "number"
                        ? src20.lim.toLocaleString()
                        : Number(src20.lim).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p>Supply:</p>
                    <p class="text-lg">
                      {typeof src20.amt === "number"
                        ? src20.amt.toLocaleString()
                        : Number(src20.amt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
