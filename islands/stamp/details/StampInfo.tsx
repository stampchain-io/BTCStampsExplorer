import { useEffect, useState } from "preact/hooks";
import StampBuyModal from "./StampBuyModal.tsx";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatDate,
} from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";

import { StampRow } from "globals";

interface StampInfoProps {
  stamp: StampRow;
  lowestPriceDispenser: any;
}

export function StampInfo({ stamp, lowestPriceDispenser }: StampInfoProps) {
  console.log("StampInfo received stamp:", {
    stamp_mimetype: stamp.stamp_mimetype,
    stamp_url: stamp.stamp_url,
    full_stamp: stamp,
  });

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

  const createdDate = (() => {
    const date = new Date(stamp.block_time);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      // Show relative time for < 24 hours
      const hours = Math.floor(diffHours);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    // Otherwise show numeric date
    return formatDate(date, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      includeRelative: false,
    });
  })();

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

  const titleGreyLDClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient1";
  const subTitleGreyClassName =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const dataContainerClassName =
    "flex justify-between items-center dark-gradient p-3 mobileMd:p-6";
  const dataColumnClassName = "flex flex-col -space-y-1";
  const dataLabelClassName =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueClassName =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
  const buttonPurpleFlatClassName =
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors";

  useEffect(() => {
    if (!stamp?.stamp_mimetype) {
      console.log("Missing stamp_mimetype:", stamp?.stamp_mimetype);
      return;
    }

    if (stamp.stamp_mimetype.startsWith("image/")) {
      const src = getStampImageSrc(stamp);
      console.log("Attempting to load image from:", src);

      const img = new Image();
      img.onload = () => {
        console.log("Image loaded with dimensions:", {
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = (error) => {
        console.error("Failed to load image for dimensions:", error);
      };
      img.src = src;

      // Fetch the image to get file size
      fetch(src)
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.blob();
        })
        .then((blob) => {
          console.log("Image size fetched:", blob.size);
          setImageSize(blob.size);
        })
        .catch((error) => {
          console.error("Failed to fetch image size:", error);
        });
    }
  }, [stamp?.stamp_mimetype]);
  return (
    <div>
      <div className={"flex flex-col gap-3 mobileMd:gap-6"}>
        <div className="dark-gradient p-3 mobileMd:p-6">
          <p className={titleGreyLDClassName}>
            <span className="font-light">#</span>
            <span className="font-black">{stamp.stamp}</span>
          </p>
          <a
            href={`https://explorer.unspendablelabs.com/assets/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base mobileLg:text-lg desktop:text-xl font-bold text-stamp-grey-darker block"
          >
            {stamp.cpid}
          </a>
          <p className="text-lg mobileLg:text-2xl desktop:text-3xl font-extralight text-stamp-grey-light mt-1.5 mobileLg:mt-3">
            <span className="text-stamp-grey-darker font-extralight">
              BY{" "}
            </span>
            <a
              className="font-bold"
              href={`/wallet/${stamp.creator}`}
              target="_parent"
            >
              {creatorDisplay}
            </a>
          </p>

          <p className="text-stamp-grey-light text-base mobileLg:text-lg desktop:text-2xl mt-3 mobileLg:mt-6">
            <span className="font-bold">{editionCount}{" "}</span>
            <span className="text-stamp-grey-darker font-light uppercase">
              {editionLabel}
            </span>
          </p>

          <div className="flex flex-col gap-4 items-end">
            <div className="flex flex-col gap-1.5 w-full text-right">
              <p className="text-stamp-grey-darker font-bold text-sm mobileMd:text-base tablet:text-2xl desktop:text-3xl">
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
                className={`${buttonPurpleFlatClassName} float-right`}
                onClick={toggleModal}
              >
                BUY
              </button>
            )}
          </div>
        </div>

        <div className={dataContainerClassName}>
          <div className={dataColumnClassName}>
            <p className={dataLabelClassName}>TYPE</p>
            <p className={dataValueClassName}>
              {fileExtension}
            </p>
          </div>
          <div className={`${dataColumnClassName} items-center`}>
            <p className={dataLabelClassName}>DIMENSIONS</p>
            <p className={dataValueClassName}>
              {imageDimensions
                ? `${imageDimensions.width} x ${imageDimensions.height}px`
                : "N/A"}
            </p>
          </div>
          <div className={`${dataColumnClassName} items-end`}>
            <p className={dataLabelClassName}>SIZE</p>
            <p className={dataValueClassName}>
              {imageSize ? `${(imageSize / 1024).toFixed(2)} KB` : "N/A"}
            </p>
          </div>
        </div>

        <div className={dataContainerClassName}>
          <div className={dataColumnClassName}>
            <p className={dataLabelClassName}>Locked</p>
            <p className={dataValueClassName}>
              {stamp.locked ?? false ? "Yes" : "No"}
            </p>
          </div>
          <div className={`${dataColumnClassName} items-center`}>
            <p className={dataLabelClassName}>Divisible</p>
            <p className={dataValueClassName}>
              {stamp.divisible ? "Yes" : "No"}
            </p>
          </div>
          <div className={`${dataColumnClassName} items-end`}>
            <p className={dataLabelClassName}>Keyburned</p>
            <p className={dataValueClassName}>
              {stamp.keyburn ?? false ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div className={dataContainerClassName}>
          <div className={dataColumnClassName}>
            <p className={dataLabelClassName}>
              Created
            </p>
            <p className={dataValueClassName}>
              {createdDate}
            </p>
          </div>
          <div className={`${dataColumnClassName} items-center`}>
            <p className={dataLabelClassName}>
              TX hash
            </p>
            <a
              href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={dataValueClassName}
            >
              {abbreviateAddress(stamp.tx_hash, 4)}
            </a>
          </div>
          <div className={`${dataColumnClassName} items-end`}>
            <p className={dataLabelClassName}>
              Block #
            </p>
            <a
              href={`/block/${stamp.block_index}`}
              className={dataValueClassName}
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
