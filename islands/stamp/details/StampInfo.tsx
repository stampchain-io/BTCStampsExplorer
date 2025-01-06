import { useEffect, useRef, useState } from "preact/hooks";
import StampBuyModal from "./StampBuyModal.tsx";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatDate,
} from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";

import { StampRow } from "$globals";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

interface StampInfoProps {
  stamp: StampRow;
  lowestPriceDispenser: any;
}

interface DimensionsType {
  width: number | string;
  height: number | string;
  unit: string | "responsive";
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
  const [imageDimensions, setImageDimensions] = useState<DimensionsType | null>(
    null,
  );
  const [fileSize, setFileSize] = useState<number | null>(null);

  const fileExtension = stamp.stamp_url?.split(".")?.pop()?.toUpperCase() ||
    "UNKNOWN";

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, 8);

  const titleGreyLD =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient1";
  const dataColumn = "flex flex-col -space-y-1";
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";
  const buttonPurpleFlat =
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors";

  // Add tooltip states
  const [isDivisibleTooltipVisible, setIsDivisibleTooltipVisible] = useState(
    false,
  );
  const [isKeyburnTooltipVisible, setIsKeyburnTooltipVisible] = useState(false);
  const [isLockedTooltipVisible, setIsLockedTooltipVisible] = useState(false);
  const [isUnlockedTooltipVisible, setIsUnlockedTooltipVisible] = useState(
    false,
  );

  const [allowDivisibleTooltip, setAllowDivisibleTooltip] = useState(true);
  const [allowKeyburnTooltip, setAllowKeyburnTooltip] = useState(true);
  const [allowLockedTooltip, setAllowLockedTooltip] = useState(true);
  const [allowUnlockedTooltip, setAllowUnlockedTooltip] = useState(true);

  const divisibleTooltipTimeoutRef = useRef<number | null>(null);
  const keyburnTooltipTimeoutRef = useRef<number | null>(null);
  const lockedTooltipTimeoutRef = useRef<number | null>(null);
  const unlockedTooltipTimeoutRef = useRef<number | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      [
        divisibleTooltipTimeoutRef,
        keyburnTooltipTimeoutRef,
        lockedTooltipTimeoutRef,
        unlockedTooltipTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) {
          globalThis.clearTimeout(ref.current);
        }
      });
    };
  }, []);

  // Tooltip handlers
  const handleDivisibleMouseEnter = () => {
    if (allowDivisibleTooltip) {
      if (divisibleTooltipTimeoutRef.current) {
        globalThis.clearTimeout(divisibleTooltipTimeoutRef.current);
      }
      divisibleTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsDivisibleTooltipVisible(true);
      }, 500);
    }
  };

  const handleDivisibleMouseLeave = () => {
    if (divisibleTooltipTimeoutRef.current) {
      globalThis.clearTimeout(divisibleTooltipTimeoutRef.current);
    }
    setIsDivisibleTooltipVisible(false);
    setAllowDivisibleTooltip(true);
  };

  const handleKeyburnMouseEnter = () => {
    if (allowKeyburnTooltip) {
      if (keyburnTooltipTimeoutRef.current) {
        globalThis.clearTimeout(keyburnTooltipTimeoutRef.current);
      }
      keyburnTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsKeyburnTooltipVisible(true);
      }, 500);
    }
  };

  const handleKeyburnMouseLeave = () => {
    if (keyburnTooltipTimeoutRef.current) {
      globalThis.clearTimeout(keyburnTooltipTimeoutRef.current);
    }
    setIsKeyburnTooltipVisible(false);
    setAllowKeyburnTooltip(true);
  };

  const handleLockedMouseEnter = () => {
    if (allowLockedTooltip) {
      if (lockedTooltipTimeoutRef.current) {
        globalThis.clearTimeout(lockedTooltipTimeoutRef.current);
      }
      lockedTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsLockedTooltipVisible(true);
      }, 500);
    }
  };

  const handleLockedMouseLeave = () => {
    if (lockedTooltipTimeoutRef.current) {
      globalThis.clearTimeout(lockedTooltipTimeoutRef.current);
    }
    setIsLockedTooltipVisible(false);
    setAllowLockedTooltip(true);
  };

  const handleUnlockedMouseEnter = () => {
    if (allowUnlockedTooltip) {
      if (unlockedTooltipTimeoutRef.current) {
        globalThis.clearTimeout(unlockedTooltipTimeoutRef.current);
      }
      unlockedTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsUnlockedTooltipVisible(true);
      }, 500);
    }
  };

  const handleUnlockedMouseLeave = () => {
    if (unlockedTooltipTimeoutRef.current) {
      globalThis.clearTimeout(unlockedTooltipTimeoutRef.current);
    }
    setIsUnlockedTooltipVisible(false);
    setAllowUnlockedTooltip(true);
  };

  useEffect(() => {
    if (!stamp?.stamp_mimetype) {
      console.log("Missing stamp_mimetype:", stamp?.stamp_mimetype);
      return;
    }

    if (stamp.stamp_mimetype.startsWith("image/")) {
      // Handle images
      const src = getStampImageSrc(stamp);
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          unit: "px",
        });
      };
      img.src = src;

      // Get image size
      fetch(src)
        .then((response) => response.blob())
        .then((blob) => setFileSize(blob.size))
        .catch((error) => console.error("Failed to fetch image size:", error));
    } else if (stamp.stamp_mimetype === "text/html") {
      // Handle HTML stamps
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((html) => {
          // Set HTML file size
          const blob = new Blob([html], { type: "text/html" });
          setFileSize(blob.size);

          // Parse HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");

          // Check for viewport meta tag
          const hasViewportMeta = doc.querySelector('meta[name="viewport"]');

          // Check for responsive units in style
          const styleTag = doc.querySelector("style");
          const hasResponsiveUnits = styleTag?.textContent?.includes("vw") ||
            styleTag?.textContent?.includes("vh") ||
            styleTag?.textContent?.includes("%");

          if (hasViewportMeta || hasResponsiveUnits) {
            setImageDimensions({
              width: "responsive",
              height: "responsive",
              unit: "responsive",
            });
          } else {
            // Try to get dimensions from style
            const bodyStyle = doc.body.getAttribute("style");
            const divStyle = doc.querySelector("div")?.getAttribute("style");

            // Parse dimensions from style
            const getDimension = (style: string | null) => {
              if (!style) return null;
              const widthMatch = style.match(/width:\s*(\d+)(px|rem|em)/);
              const heightMatch = style.match(/height:\s*(\d+)(px|rem|em)/);
              return {
                width: widthMatch ? Number(widthMatch[1]) : null,
                height: heightMatch ? Number(heightMatch[1]) : null,
                unit: (widthMatch && widthMatch[2]) ||
                  (heightMatch && heightMatch[2]) || "px",
              };
            };

            const bodyDims = getDimension(bodyStyle);
            const divDims = getDimension(divStyle);

            // Use first available dimensions
            const dims = bodyDims || divDims;

            if (dims && dims.width && dims.height) {
              setImageDimensions({
                width: dims.width,
                height: dims.height,
                unit: dims.unit,
              });
            } else {
              setImageDimensions({
                width: "responsive",
                height: "responsive",
                unit: "responsive",
              });
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch HTML content:", error);
          setImageDimensions(null);
        });
    }
  }, [stamp.stamp_mimetype, stamp.stamp_url]);

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Format dimensions display
  const getDimensionsDisplay = (dims: DimensionsType | null) => {
    if (!dims) return "N/A";
    if (dims.unit === "responsive") return "RESPONSIVE";
    return `${dims.width} x ${dims.height} ${dims.unit.toUpperCase()}`;
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <StampSearchClient
        open2={isSearchOpen}
        handleOpen2={setIsSearchOpen}
        showButton={false}
      />

      <div className={"flex flex-col gap-3 mobileMd:gap-6"}>
        <div
          className={"flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6"}
        >
          <div>
            <p className={titleGreyLD}>
              <span className="font-light">#</span>
              <span className="font-black">{stamp.stamp}</span>
            </p>
            <p className="text-base mobileLg:text-lg font-bold text-stamp-grey-darker block">
              {stamp.cpid}
            </p>

            <div className="flex flex-col items-start pt-1.5 mobileLg:pt-3">
              <p className={dataLabel}>BY</p>
              <a
                className="text-xl mobileLg:text-2xl font-black gray-gradient3-hover -mt-1"
                href={`/wallet/${stamp.creator}`}
                target="_parent"
              >
                {creatorDisplay}
              </a>
            </div>
          </div>

          <div className="flex flex-col pt-6 mobileLg:pt-12 items-end">
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
                  <span className="font-extralight">{" "}BTC</span>
                )}
              </p>
            </div>

            {lowestPriceDispenser && (
              <button
                className={`${buttonPurpleFlat} float-right mt-3 mobileMd:mt-6`}
                onClick={toggleModal}
              >
                BUY
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col dark-gradient rounded-lg p-3 mobileLg:p-6">
          <div className="flex flex-col">
            <p className={dataLabel}>{editionLabel}</p>
            <p className={dataValueXl}>{editionCount}{" "}</p>
          </div>

          <div className="flex flex-row pt-3 mobileLg:pt-6">
            <div className={`${dataColumn} flex-1 items-start`}>
              <p className={dataLabelSm}>TYPE</p>
              <p className={dataValueSm}>
                {fileExtension}
              </p>
            </div>
            <div className={`${dataColumn} flex-1 items-center`}>
              <p className={dataLabelSm}>DIMENSIONS</p>
              <p className={dataValueSm}>
                {getDimensionsDisplay(imageDimensions)}
              </p>
            </div>
            <div className="flex flex-1 justify-end items-end pb-1 space-x-[9px]">
              {stamp.divisible == true && (
                <div
                  className="relative group"
                  onMouseEnter={handleDivisibleMouseEnter}
                  onMouseLeave={handleDivisibleMouseLeave}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-[22px] h-[22px] mobileLg:w-[26px] mobileLg:h-[26px] fill-stamp-grey-darker -mb-[1px]"
                    aria-label="Divisible"
                  >
                    <path d="M25.7076 7.70497L7.70755 25.705C7.51991 25.8926 7.26541 25.998 7.00005 25.998C6.73468 25.998 6.48019 25.8926 6.29255 25.705C6.10491 25.5173 5.99949 25.2628 5.99949 24.9975C5.99949 24.7321 6.10491 24.4776 6.29255 24.29L24.2925 6.28997C24.48 6.10233 24.7344 5.99685 24.9996 5.99673C25.2649 5.99661 25.5193 6.10187 25.7069 6.28935C25.8946 6.47682 26 6.73116 26.0002 6.9964C26.0003 7.26165 25.895 7.51608 25.7076 7.70372V7.70497ZM6.31755 12.68C5.47366 11.8359 4.99964 10.6912 4.99976 9.49765C4.99987 8.3041 5.47412 7.15948 6.31817 6.3156C7.16222 5.47171 8.30694 4.99769 9.50049 4.9978C10.694 4.99792 11.8387 5.47217 12.6825 6.31622C13.5264 7.16027 14.0005 8.30499 14.0003 9.49854C14.0002 10.6921 13.526 11.8367 12.6819 12.6806C11.8379 13.5245 10.6932 13.9985 9.49961 13.9984C8.30606 13.9983 7.16143 13.524 6.31755 12.68ZM7.00005 9.49997C7.00037 9.91103 7.10205 10.3157 7.29608 10.6781C7.49011 11.0404 7.7705 11.3494 8.11243 11.5775C8.45436 11.8057 8.84727 11.946 9.25637 11.9861C9.66547 12.0262 10.0781 11.9647 10.4578 11.8073C10.8375 11.6498 11.1725 11.4011 11.4332 11.0832C11.6938 10.7654 11.8721 10.3882 11.9522 9.98497C12.0322 9.58178 12.0116 9.16507 11.8922 8.77174C11.7728 8.37841 11.5583 8.02059 11.2675 7.72997C10.9178 7.3803 10.4721 7.14223 9.98701 7.04589C9.5019 6.94955 8.99911 6.99927 8.54226 7.18875C8.08541 7.37824 7.69502 7.69898 7.4205 8.11038C7.14598 8.52179 6.99966 9.00538 7.00005 9.49997ZM27 22.5C26.9998 23.5411 26.6386 24.5499 25.978 25.3545C25.3173 26.1591 24.3981 26.7098 23.377 26.9127C22.3559 27.1155 21.296 26.9581 20.3779 26.4671C19.4599 25.9762 18.7405 25.1821 18.3423 24.2202C17.944 23.2583 17.8917 22.188 18.1941 21.1918C18.4965 20.1956 19.1349 19.3351 20.0007 18.7569C20.8664 18.1786 21.9058 17.9185 22.9419 18.0207C23.978 18.1229 24.9465 18.5812 25.6826 19.3175C26.1017 19.7344 26.434 20.2304 26.6601 20.7767C26.8863 21.323 27.0018 21.9087 27 22.5ZM25 22.5C25.0002 21.9216 24.7997 21.361 24.4329 20.9139C24.0661 20.4667 23.5555 20.1605 22.9883 20.0476C22.421 19.9346 21.8321 20.0219 21.322 20.2944C20.8118 20.567 20.412 21.008 20.1905 21.5423C19.9691 22.0766 19.9398 22.6712 20.1076 23.2247C20.2754 23.7782 20.6299 24.2565 21.1108 24.5779C21.5916 24.8993 22.1691 25.044 22.7447 24.9874C23.3203 24.9308 23.8585 24.6764 24.2675 24.2675C24.5004 24.0359 24.6851 23.7605 24.8108 23.4571C24.9366 23.1537 25.0009 22.8284 25 22.5Z" />
                  </svg>
                  <div
                    className={`${tooltipIcon} ${
                      isDivisibleTooltipVisible ? "opacity-100" : "opacity-0"
                    } -mb-[1px]`}
                  >
                    DIVISIBLE
                  </div>
                </div>
              )}
              {stamp.keyburn != null && (
                <div
                  className="relative group"
                  onMouseEnter={handleKeyburnMouseEnter}
                  onMouseLeave={handleKeyburnMouseLeave}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                    aria-label="Keyburned"
                  >
                    <path d="M22.9862 19.1675C22.7269 20.6159 22.0301 21.9501 20.9896 22.9904C19.949 24.0308 18.6147 24.7273 17.1663 24.9863C17.1113 24.9951 17.0557 24.9997 17 25C16.7492 25 16.5075 24.9056 16.323 24.7357C16.1384 24.5659 16.0245 24.3328 16.0037 24.0828C15.9829 23.8328 16.0569 23.5842 16.2108 23.3862C16.3648 23.1882 16.5876 23.0552 16.835 23.0138C18.9062 22.665 20.6637 20.9075 21.015 18.8325C21.0594 18.571 21.2059 18.3378 21.4223 18.1842C21.6387 18.0307 21.9072 17.9694 22.1688 18.0138C22.4303 18.0582 22.6635 18.2047 22.8171 18.4211C22.9706 18.6375 23.0319 18.906 22.9875 19.1675H22.9862ZM27 18C27 20.9174 25.8411 23.7153 23.7782 25.7782C21.7153 27.8411 18.9174 29 16 29C13.0826 29 10.2847 27.8411 8.22183 25.7782C6.15893 23.7153 5 20.9174 5 18C5 14.51 6.375 10.9413 9.0825 7.39379C9.1682 7.28146 9.27674 7.18857 9.40095 7.12123C9.52516 7.0539 9.66223 7.01365 9.80313 7.00314C9.94403 6.99263 10.0856 7.01209 10.2184 7.06025C10.3512 7.10841 10.4723 7.18417 10.5737 7.28254L13.5887 10.2088L16.3388 2.65754C16.3937 2.50693 16.484 2.37174 16.6022 2.26337C16.7203 2.15499 16.8628 2.0766 17.0175 2.03481C17.1723 1.99303 17.3349 1.98906 17.4915 2.02326C17.6481 2.05745 17.7942 2.1288 17.9175 2.23129C20.6512 4.50004 27 10.5688 27 18ZM25 18C25 12.2388 20.5262 7.26004 17.7237 4.70879L14.94 12.3425C14.8829 12.4993 14.7874 12.6393 14.6623 12.7498C14.5372 12.8602 14.3865 12.9376 14.2238 12.9749C14.0612 13.0122 13.8918 13.0082 13.7311 12.9632C13.5704 12.9183 13.4235 12.8338 13.3038 12.7175L10.0075 9.52004C8.01125 12.4013 7 15.25 7 18C7 20.387 7.94821 22.6762 9.63604 24.364C11.3239 26.0518 13.6131 27 16 27C18.3869 27 20.6761 26.0518 22.364 24.364C24.0518 22.6762 25 20.387 25 18Z" />
                  </svg>
                  <div
                    className={`${tooltipIcon} ${
                      isKeyburnTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    KEYBURNED
                  </div>
                </div>
              )}
              {stamp.locked == true && (
                <div
                  className="relative group"
                  onMouseEnter={handleLockedMouseEnter}
                  onMouseLeave={handleLockedMouseLeave}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                    aria-label="Locked"
                  >
                    <path d="M26 10H22V7C22 5.4087 21.3679 3.88258 20.2426 2.75736C19.1174 1.63214 17.5913 1 16 1C14.4087 1 12.8826 1.63214 11.7574 2.75736C10.6321 3.88258 10 5.4087 10 7V10H6C5.46957 10 4.96086 10.2107 4.58579 10.5858C4.21071 10.9609 4 11.4696 4 12V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V12C28 11.4696 27.7893 10.9609 27.4142 10.5858C27.0391 10.2107 26.5304 10 26 10ZM12 7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3C17.0609 3 18.0783 3.42143 18.8284 4.17157C19.5786 4.92172 20 5.93913 20 7V10H12V7ZM26 26H6V12H26V26Z" />
                  </svg>
                  <div
                    className={`${tooltipIcon} ${
                      isLockedTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    LOCKED
                  </div>
                </div>
              )}
              {stamp.locked != true && (
                <div
                  className="relative group"
                  onMouseEnter={handleUnlockedMouseEnter}
                  onMouseLeave={handleUnlockedMouseLeave}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6 fill-stamp-grey-darker"
                    aria-label="Unlocked"
                  >
                    <path d="M26 10H12V7C12 5.93913 12.4214 4.92172 13.1716 4.17157C13.9217 3.42143 14.9391 3 16 3C17.9213 3 19.65 4.375 20.02 6.19875C20.0749 6.45646 20.2294 6.68207 20.4497 6.82655C20.6701 6.97103 20.9385 7.0227 21.1968 6.97032C21.455 6.91795 21.6822 6.76577 21.8288 6.54686C21.9755 6.32795 22.0298 6.06 21.98 5.80125C21.415 3.01875 18.9 1 16 1C14.4092 1.00165 12.884 1.63433 11.7592 2.75919C10.6343 3.88405 10.0017 5.40921 10 7V10H6C5.46957 10 4.96086 10.2107 4.58579 10.5858C4.21071 10.9609 4 11.4696 4 12V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V12C28 11.4696 27.7893 10.9609 27.4142 10.5858C27.0391 10.2107 26.5304 10 26 10ZM26 26H6V12H26V26Z" />
                  </svg>
                  <div
                    className={`${tooltipIcon} ${
                      isUnlockedTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    UNLOCKED
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row pt-1.5 mobileLg:pt-3">
            <div className={`${dataColumn} flex-1 items-start`}>
              <p className={dataLabelSm}>SIZE</p>
              <p className={dataValueSm}>
                {formatFileSize(fileSize)}
              </p>
            </div>
            <div className={`${dataColumn} flex-1 items-center`}>
              <p className={dataLabelSm}>CREATED</p>
              <p className={dataValueSm}>
                {createdDate}
              </p>
            </div>
            <div className={`${dataColumn} flex-1 items-end`}>
              <p className={dataLabelSm}>TX HASH</p>
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
    </>
  );
}
