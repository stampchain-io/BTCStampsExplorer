import { useEffect, useState } from "preact/hooks";
import StampBuyModal from "./StampBuyModal.tsx";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatDate,
} from "$lib/utils/formatUtils.ts";

import { StampRow } from "globals";

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

  const createdDate = formatDate(new Date(stamp.block_time), {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    includeRelative: true,
  });

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

  const fileExtension = stamp.stamp_url?.split(".")?.pop()?.toUpperCase() ||
    "UNKNOWN";

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, 8);

  useEffect(() => {
    if (stamp.stamp_mimetype.startsWith("image/") && stamp.stamp_url) {
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
          <p className="bg-text-purple-1 bg-clip-text text-transparent text-4xl tablet:text-5xl desktop:text-6xl">
            <span className="font-light">#</span>
            <span className="font-black">{stamp.stamp}</span>
          </p>
          <a
            href={`https://explorer.unspendablelabs.com/assets/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#660099] text-base tablet:text-lg desktop:text-2xl font-bold overflow-hidden text-ellipsis whitespace-nowrap block"
          >
            {stamp.cpid}
          </a>
          <p className="text-[#8800CC] overflow-hidden text-ellipsis whitespace-nowrap text-2xl mobileLg:text-4xl desktop:text-5xl mb-4">
            <span className="font-extralight">BY{" "}</span>
            <a
              className="text-[#8800CC] font-light"
              href={`/wallet/${stamp.creator}`}
              target="_parent"
            >
              {creatorDisplay}
            </a>
          </p>

          <p className="text-[#666666] text-lg mobileLg:text-2xl desktop:text-3xl">
            <span className="font-bold">{editionCount}{" "}</span>
            <span className="font-medium">{editionLabel}</span>
          </p>

          <div className="flex flex-col gap-4 items-end mt-6">
            <div className="flex flex-col gap-1 w-full text-right">
              <p className="text-[#999999] font-bold text-sm mobileLg:text-base tablet:text-2xl desktop:text-3xl">
                {(!stamp.floorPrice || stamp.floorPrice === "priceless") &&
                    stamp.marketCap && typeof stamp.marketCap === "number"
                  ? formatBTCAmount(stamp.marketCap)
                  : typeof stamp.floorPrice === "number"
                  ? formatBTCAmount(stamp.floorPrice)
                  : stamp.floorPrice}
                {(typeof stamp.floorPrice === "number" ||
                  (stamp.marketCap && typeof stamp.marketCap === "number")) &&
                  (
                    <span className="text-sm mobileLg:text-base tablet:text-2xl desktop:text-3xl font-medium">
                      {" "}BTC
                    </span>
                  )}
              </p>
              {(stamp.floorPriceUSD || stamp.marketCapUSD) && (
                <p className="text-[#999999] font-bold text-xs mobileLg:text-sm desktop:text-base">
                  {stamp.floorPriceUSD
                    ? `${
                      stamp.floorPriceUSD.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })
                    }`
                    : stamp.marketCapUSD
                    ? `${
                      stamp.marketCapUSD.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })
                    }`
                    : null}
                  <span className="text-xs mobileLg:text-sm desktop:text-base font-light">
                    {" "}USD
                  </span>
                </p>
              )}
            </div>

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
          <div className="flex justify-between items-center flex-col tablet:items-start gap-1">
            <p className="text-[#666666] font-light uppercase">TYPE</p>
            <p className="text-[#999999] uppercase font-medium">
              {fileExtension}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col tablet:items-center gap-1">
            <p className="text-[#666666] font-light uppercase">DIMENSIONS</p>
            <p className="text-[#999999] uppercase font-medium">
              {imageDimensions
                ? `${imageDimensions.width} x ${imageDimensions.height}px`
                : "N/A"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col tablet:items-end gap-1">
            <p className="text-[#666666] font-light uppercase">SIZE</p>
            <p className="text-[#999999] uppercase font-medium">
              {imageSize ? `${(imageSize / 1024).toFixed(2)} KB` : "N/A"}
            </p>
          </div>
        </div>

        <div
          className={"flex justify-between items-center dark-gradient p-6"}
        >
          <div className="flex justify-between items-center flex-col tablet:items-start gap-1">
            <p className="text-[#666666] font-light uppercase">Locked</p>
            <p className="text-[#999999] uppercase font-medium">
              {stamp.locked ?? false ? "Yes" : "No"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col tablet:items-center gap-1">
            <p className="text-[#666666] font-light uppercase">Divisible</p>
            <p className="text-[#999999] uppercase font-medium">
              {stamp.divisible ? "Yes" : "No"}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col tablet:items-end gap-1">
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
              {createdDate}
            </p>
          </div>
          <div className="flex justify-between items-center flex-col tablet:items-center gap-1">
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
          <div className="flex justify-between items-center flex-col tablet:items-end gap-1">
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
