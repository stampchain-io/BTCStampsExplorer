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
  const dataContainer =
    "flex justify-between items-center dark-gradient p-3 mobileLg:p-6";
  const dataColumn = "flex flex-col -space-y-1";
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXs =
    "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const dataValue =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
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
      <div
        className={"flex flex-col dark-gradient p-3 mobileMd:p-6 gap-3 mobileMd:gap-6"}
      >
        <div className="">
          <p className={titleGreyLDClassName}>
            <span className="font-light">#</span>
            <span className="font-black">{stamp.stamp}</span>
          </p>
          <a
            href={`https://explorer.unspendablelabs.com/assets/${stamp.cpid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base mobileLg:text-lg font-bold text-stamp-grey-darker hover-stamp-grey-light block"
          >
            {stamp.cpid}
          </a>

          <div className={"flex flex-col items-start pt-3"}>
            <p className={dataLabel}>BY</p>
            <a
              className="text-xl mobileLg:text-2xl font-black gray-gradient3 -mt-1"
              href={`/wallet/${stamp.creator}`}
              target="_parent"
            >
              {creatorDisplay}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex flex-col w-full text-right">
            {(stamp.floorPriceUSD || stamp.marketCapUSD) && (
              <p className={dataLabel}>
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
                <span className="font-light">
                  {" "}USD
                </span>
              </p>
            )}

            <p className={dataValueXl}>
              {(!stamp.floorPrice || stamp.floorPrice === "NOT LISTED") &&
                  stamp.marketCap && typeof stamp.marketCap === "number"
                ? formatBTCAmount(stamp.marketCap, { excludeSuffix: true })
                : typeof stamp.floorPrice === "number"
                ? formatBTCAmount(stamp.floorPrice, { excludeSuffix: true })
                : stamp.floorPrice}
              {(typeof stamp.floorPrice === "number" ||
                (stamp.marketCap && typeof stamp.marketCap === "number")) && (
                <span className="font-light">{" "}BTC</span>
              )}
            </p>
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

      <div className="flex flex-col dark-gradient p-3 mobileLg:p-6">
        <div className="flex flex-col min-[880px]:items-end min-[880px]:text-right">
          <p className={dataLabel}>{editionLabel}</p>
          <p className={dataValueXl}>{editionCount}{" "}</p>
        </div>

        <div className="flex flex-row pt-3">
          <div className={`${dataColumn} flex-1 items-start`}>
            <p className={dataLabelSm}>TYPE</p>
            <p className={dataValueSm}>
              {fileExtension}
            </p>
          </div>
          <div className={`${dataColumn} flex-1 items-center`}>
            <p className={dataLabelSm}>DIMENSIONS</p>
            <p className={`${dataValueSm}`}>
              {imageDimensions
                ? `${imageDimensions.width} x ${imageDimensions.height} PX`
                : "N/A"}
            </p>
          </div>
          <div className={`${dataColumn} flex-1 items-end`}>
            <p className={dataLabelSm}>SIZE</p>
            <p className={dataValueSm}>
              {imageSize ? `${(imageSize / 1024).toFixed(2)} KB` : "N/A"}
            </p>
          </div>
        </div>

        <div className="flex flex-row pt-3">
          <div className={`${dataColumn} flex-1 items-start`}>
            <p className={dataLabelSm}>
              CREATED
            </p>
            <p className={dataValueSm}>
              {createdDate}
            </p>
          </div>
          <div className={`${dataColumn} flex-1 items-end`}>
            <p className={dataLabelSm}>
              TX HASH
            </p>
            <a
              href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={dataValueSm}
            >
              {abbreviateAddress(stamp.tx_hash, 4)}
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
