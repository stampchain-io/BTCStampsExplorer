import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "utils/util.ts";

import StampBuyModal from "./StampBuyModal.tsx";

import { StampRow } from "globals";

import { useEffect, useState } from "preact/hooks";

dayjs.extend(relativeTime);

export function StampInfo({ stamp }: { stamp: StampRow }) {
  console.log("stamp: ", stamp);

  const [fee, setFee] = useState<number>(0);
  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = (event: MouseEvent) => {
    setIsModalOpen(false);
  };
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  const timestamp = new Date(stamp.block_time);
  const _type = stamp.is_btc_stamp
    ? "stamp"
    : stamp.cpid.startsWith("A")
    ? "cursed"
    : "posh";

  const editionCount = stamp.divisible
    ? (stamp.supply / 100000000).toFixed(2)
    : stamp.supply > 100000
    ? "+100000"
    : stamp.supply;

  const editionLabel = stamp.supply === 1 ? "edition" : "editions";
  const [imageDimensions, setImageDimensions] = useState<
    { width: number; height: number } | null
  >(null);
  const [imageSize, setImageSize] = useState<number | null>(null);

  const fileExtension = stamp.stamp_url
    ? stamp.stamp_url.split(".").pop()?.split("?")[0].toLowerCase()
    : "unknown";

  useEffect(() => {
    if (stamp.stamp_mimetype.startsWith("image/") && stamp.stamp_url) {
      // Create an Image object to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        console.error("Failed to load image for dimensions.");
      };
      img.src = stamp.stamp_url;

      // Fetch the image to get file size
      fetch(stamp.stamp_url)
        .then((response) => response.blob())
        .then((blob) => {
          setImageSize(blob.size);
        })
        .catch((error) => {
          console.error("Failed to fetch image size:", error);
        });
    }
  }, [stamp.stamp_mimetype, stamp.stamp_url]);
  return (
    <>
      <div className={"flex flex-col gap-4"}>
        <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6">
          <p className={"text-6xl font-bold text-[#8800CC]"}>
            # {stamp.stamp}
          </p>
          <a
            href={`https://explorer.unspendablelabs.com/assets/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#660099] text-4xl font-bold overflow-hidden text-ellipsis whitespace-nowrap block"
          >
            {stamp.cpid}
          </a>
          <p class="hidden md:block text-[#8800CC] overflow-hidden text-ellipsis whitespace-nowrap text-4xl font-light">
            by{" "}
            <span className={"font-bold"}>
              {stamp.creator_name
                ? stamp.creator_name
                : (
                  <a href={`/wallet/${stamp.creator}`}>
                    {stamp.creator}
                  </a>
                )}
            </span>
          </p>

          <p class="text-[#666666] font-bold text-3xl">
            {editionCount} {editionLabel}
          </p>

          <p class="text-[#666666] font-medium text-2xl">
            {typeof stamp.floorPrice === "number"
              ? `${stamp.floorPrice} BTC`
              : stamp.floorPrice}
          </p>

          <span class="inline-block border-2 border-[#666666] text-[#666666] font-medium text-lg rounded p-2">
            {stamp.stamp_mimetype}
          </span>

          <button
            className={"border-[3px] border-[#660099] rounded-md text-xl leading-6 text-[#660099] px-6 py-4 float-right mt-28"}
            onClick={toggleModal}
          >
            BUY
          </button>
        </div>

        <div
          className={"flex justify-between items-center bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6"}
        >
          <div class="flex justify-between items-center flex-col md:items-start gap-1">
            <p class="text-[#660099] font-light uppercase">TYPE</p>
            <p class="text-[#999999] uppercase">
              {fileExtension}
            </p>
          </div>
          <div class="flex justify-between items-center flex-col md:items-center gap-1">
            <p class="text-[#660099] font-light uppercase">DIMENSIONS</p>
            <p class="text-[#999999] uppercase">
              {imageDimensions
                ? `${imageDimensions.width} x ${imageDimensions.height}px`
                : "N/A"}
            </p>
          </div>
          <div class="flex justify-between items-center flex-col md:items-end gap-1">
            <p class="text-[#660099] font-light uppercase">SIZE</p>
            <p class="text-[#999999] uppercase">
              {imageSize ? `${(imageSize / 1024).toFixed(2)} KB` : "N/A"}
            </p>
          </div>
        </div>

        <div
          className={"flex justify-between items-center bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6"}
        >
          <div class="flex justify-between items-center flex-col md:items-start gap-1">
            <p class="text-[#660099] font-light uppercase">Locked</p>
            <p class="text-[#999999] uppercase">
              {stamp.locked ?? false ? "Yes" : "No"}
            </p>
          </div>
          <div class="flex justify-between items-center flex-col md:items-center gap-1">
            <p class="text-[#660099] font-light uppercase">Divisible</p>
            <p class="text-[#999999] uppercase">
              {stamp.divisible ? "Yes" : "No"}
            </p>
          </div>
          <div class="flex justify-between items-center flex-col md:items-end gap-1">
            <p class="text-[#660099] font-light uppercase">Keyburned</p>
            <p class="text-[#999999] uppercase">
              {stamp.keyburn ?? false ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div
          className={"bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 flex flex-col gap-7"}
        >
          <div className={"flex justify-between"}>
            <div class="flex flex-col justify-between items-start gap-1">
              <p class="text-lg font-light text-[#660099] uppercase">Created</p>
              <p class="text-[#999999]">
                {timestamp.toLocaleDateString()} ({dayjs(timestamp).fromNow()})
              </p>
            </div>

            <div class="flex justify-between items-center flex-col md:items-end gap-1">
              <p class="text-lg font-light text-[#660099] uppercase">Block #</p>
              <a
                href={`/block/${stamp.block_index}`}
                class="text-[#999999] hover:underline"
              >
                {stamp.block_index}
              </a>
            </div>
          </div>

          <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1">
            <p class="text-lg font-light text-[#660099] uppercase">TX hash</p>
            <div class="flex justify-between items-center md:w-full gap-2">
              <a
                href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                class="block md:hidden text-[#60626F]"
              >
                {abbreviateAddress(stamp.tx_hash, 12)}
              </a>
              <a
                href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                class="hidden md:block text-[#999999] overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {stamp.tx_hash}
              </a>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <StampBuyModal
          stamp={stamp}
          fee={fee}
          handleChangeFee={handleChangeFee}
          toggleModal={() => setIsModalOpen(false)}
          handleCloseModal={handleCloseModal}
        />
      )}

      {
        /* <div class="flex flex-col text-gray-200 font-semibold bg-[#2B0E49]">
        <div class="flex items-center truncate text-[#C184FF] text-2xl md:text-5xl p-6 pb-0">
          <p>
            # {stamp.stamp}
          </p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <a
            href={`https://xcp.dev/asset/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#60626F]"
          >
            {stamp.cpid}
          </a>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Creator</p>
          <div class="flex justify-between items-center md:w-full gap-2">
            <p class="block md:hidden text-[#60626F]">
              {stamp.creator_name
                ? stamp.creator_name
                : (
                  <a href={`/wallet/${stamp.creator}`}>
                    {abbreviateAddress(stamp.creator, 12)}
                  </a>
                )}
            </p>
            <p class="hidden md:block text-[#60626F] overflow-hidden text-ellipsis whitespace-nowrap">
              {stamp.creator_name
                ? stamp.creator_name
                : (
                  <a href={`/wallet/${stamp.creator}`}>
                    {stamp.creator}
                  </a>
                )}
            </p>
            <img
              src="/img/icon_copy_to_clipboard.png"
              className="w-4 h-5 cursor-pointer"
              onClick={() => copyToClipboard(stamp.creator)}
              alt="Copy to clipboard"
            />
          </div>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Editions</p>
          <p class="text-[#60626F]">
            {stamp.divisible
              ? (stamp.supply / 100000000).toFixed(2)
              : stamp.supply > 100000
              ? "+100000"
              : stamp.supply}
          </p>
        </div>
        <div class="flex justify-between items-end gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Created</p>
          <p class="text-[#60626F]">
            {timestamp.toLocaleDateString()} ({dayjs(timestamp).fromNow()})
          </p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Block #</p>
          <div class="flex justify-between items-center md:w-full gap-2">
            <a
              href={`/block/${stamp.block_index}`}
              class="text-[#60626F] hover:underline"
            >
              {stamp.block_index}
            </a>
            <img
              src="/img/icon_copy_to_clipboard.png"
              className="w-4 h-5 cursor-pointer"
              onClick={() => copyToClipboard(stamp.block_index.toString())}
              alt="Copy to clipboard"
            />
          </div>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">TX hash</p>
          <div class="flex justify-between items-center md:w-full gap-2">
            <a
              href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              class="block md:hidden text-[#60626F]"
            >
              {abbreviateAddress(stamp.tx_hash, 12)}
            </a>
            <a
              href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              class="hidden md:block text-[#60626F] overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {stamp.tx_hash}
            </a>
            <img
              src="/img/icon_copy_to_clipboard.png"
              className="w-4 h-5 cursor-pointer"
              onClick={() => copyToClipboard(stamp.tx_hash)}
              alt="Copy to clipboard"
            />
          </div>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Locked</p>
          <p class="text-[#60626F]">{stamp.locked ?? false ? "Yes" : "No"}</p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Divisible</p>
          <p class="text-[#60626F]">{stamp.divisible ? "Yes" : "No"}</p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Keyburned</p>
          <p class="text-[#60626F]">{stamp.keyburn ?? false ? "Yes" : "No"}</p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Floor Price</p>
          <p class="text-[#60626F]">
            {typeof stamp.floorPrice === "number"
              ? `${stamp.floorPrice} BTC`
              : stamp.floorPrice}
          </p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Market Cap</p>
          <p class="text-[#60626F]">
            {typeof stamp.marketCap === "number"
              ? `${parseFloat(stamp.marketCap.toFixed(8)).toString()} BTC`
              : stamp.marketCap}
          </p>
        </div>
        <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
          <p class="text-xl font-semibold">Vault Address</p>
          <p class="text-[#60626F]">pending</p>
        </div>
      </div> */
      }
    </>
  );
}
