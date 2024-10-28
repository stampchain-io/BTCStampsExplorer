import { useEffect, useState } from "preact/hooks";
import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import StampBuyModal from "./StampBuyModal.tsx";
import { abbreviateAddress } from "$lib/utils/util.ts";

import { StampRow } from "globals";

dayjs.extend(relativeTime);

interface StampInfoProps {
  stamp: StampRow;
  lowestPriceDispenser: any;
}

export function StampInfo({ stamp, lowestPriceDispenser }: StampInfoProps) {
  console.log("stamp: ", stamp);

  const [fee, setFee] = useState<number>(0);
  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
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

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator);

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
    <div>
      <div className={"flex flex-col gap-4"}>
        <div className="dark-gradient p-6">
          <p className={"text-6xl font-bold text-[#8800CC]"}>
            # {stamp.stamp}
          </p>
          <a
            href={`https://explorer.unspendablelabs.com/assets/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#660099] text-4xl font-bold overflow-hidden text-ellipsis whitespace-nowrap block"
          >
            {stamp.cpid}
          </a>
          <p className="hidden md:block text-[#8800CC] overflow-hidden text-ellipsis whitespace-nowrap text-4xl font-light">
            BY{" "}
            <span className={"font-bold"}>
              <a
                className="text-[#8800CC]"
                href={`/wallet/${stamp.creator}`}
              >
                {stamp.creator_name
                  ? stamp.creator_name
                  : abbreviateAddress(stamp.creator, 6)}
              </a>
            </span>
          </p>

          <p className="text-[#666666] font-bold text-3xl">
            {editionCount} {editionLabel}
          </p>

          <div className="flex flex-col gap-6 items-end mt-6">
            {/* TODO: display USD price as well */}
            <p className="text-[#666666] font-medium text-2xl">
              {typeof stamp.floorPrice === "number"
                ? `${stamp.floorPrice} BTC`
                : stamp.floorPrice}
            </p>

            {lowestPriceDispenser && (
              <button
                className="bg-[#8800CC] rounded-md font-extrabold text-[#080808] px-6 py-4 float-right"
                onClick={toggleModal}
              >
                BUY
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center dark-gradient p-6">
          <div className="flex justify-between items-center flex-col md:items-start gap-1">
            <p className="text-[#666666] font-light uppercase">TYPE</p>
            <p className="text-[#999999] uppercase font-medium">
              {fileExtension}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col md:items-center gap-1">
            <p className="text-[#666666] font-light uppercase">DIMENSIONS</p>
            <p className="text-[#999999] uppercase font-medium">
              {imageDimensions
                ? `${imageDimensions.width} x ${imageDimensions.height}px`
                : "N/A"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col md:items-end gap-1">
            <p className="text-[#666666] font-light uppercase">SIZE</p>
            <p className="text-[#999999] uppercase font-medium">
              {imageSize ? `${(imageSize / 1024).toFixed(2)} KB` : "N/A"}
            </p>
          </div>
        </div>

        <div
          className={"flex justify-between items-center dark-gradient p-6"}
        >
          <div className="flex justify-between items-center flex-col md:items-start gap-1">
            <p className="text-[#666666] font-light uppercase">Locked</p>
            <p className="text-[#999999] uppercase font-medium">
              {stamp.locked ?? false ? "Yes" : "No"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col md:items-center gap-1">
            <p className="text-[#666666] font-light uppercase">Divisible</p>
            <p className="text-[#999999] uppercase font-medium">
              {stamp.divisible ? "Yes" : "No"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col md:items-end gap-1">
            <p className="text-[#666666] font-light uppercase">Keyburned</p>
            <p className="text-[#999999] uppercase font-medium">
              {stamp.keyburn ?? false ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div
          className={"dark-gradient p-6 flex justify-between gap-7"}
        >
          <div className="flex flex-col justify-between items-start gap-1">
            <p className="text-lg font-light text-[#666666] uppercase">
              Created
            </p>
            <p className="text-[#999999] font-medium">
              {timestamp.toLocaleDateString()} ({dayjs(timestamp).fromNow()})
            </p>
          </div>
          <div className="flex justify-between items-center flex-col md:items-center gap-1">
            <p className="text-[#666666] font-light uppercase">TX hash</p>
            <a
              href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#999999] font-medium"
            >
              {abbreviateAddress(stamp.tx_hash, 4)}
            </a>
          </div>
          <div className="flex justify-between items-center flex-col md:items-end gap-1">
            <p className="text-lg font-light text-[#666666] uppercase text-nowrap">
              Block #
            </p>
            <a
              href={`/block/${stamp.block_index}`}
              className="text-[#999999] hover:underline font-medium"
            >
              {stamp.block_index}
            </a>
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
          dispenser={lowestPriceDispenser} // Pass the dispenser to the modal
        />
      )}
    </div>
  );
}
