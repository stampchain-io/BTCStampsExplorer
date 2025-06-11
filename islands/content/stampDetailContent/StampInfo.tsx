/* ===== STAMP INFO COMPONENT ===== */
/*@baba-750+764+815+icons - refactor to StatItems */
import { useEffect, useRef, useState } from "preact/hooks";
import BuyStampModal from "$islands/modal/BuyStampModal.tsx";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatDate,
} from "$lib/utils/formatUtils.ts";
import { getSRC101Data, getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { Src101Detail, StampRow } from "$globals";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { calculateTransactionSize } from "$lib/utils/identifierUtils.ts";
import {
  body,
  containerBackground,
  containerColData,
  gapSectionSlim,
} from "$layout";
import {
  headingGreyDLLink,
  labelSm,
  titleGreyLD,
  value3xl,
  valueDark,
  valueSm,
} from "$text";
import { Button } from "$button";
import { Dispenser, StampListingsOpenTable } from "$table";
import { tooltipIcon } from "$notification";
import { openModal } from "$islands/modal/states.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { Icon } from "$icon";

/* ===== TYPES ===== */
interface StampInfoProps {
  stamp: StampRow;
  lowestPriceDispenser: any;
}

interface DimensionsType {
  width: number | string;
  height: number | string;
  unit: string | "responsive";
}

/* ===== COMPONENT ===== */
export function StampInfo({ stamp, lowestPriceDispenser }: StampInfoProps) {
  /* ===== STATE ===== */
  const [fee, setFee] = useState<number>(0);
  const handleChangeFee = (newFee: number) => {
    setFee(newFee);
  };

  const toggleModal = (dispenser?: Dispenser) => {
    if (dispenser) {
      setSelectedDispenser(dispenser);
    }

    // Create modal content
    const modalContent = (
      <BuyStampModal
        stamp={stamp}
        fee={fee}
        handleChangeFee={handleChangeFee}
        dispenser={selectedDispenser || lowestPriceDispenser}
      />
    );

    // Show modal with animation
    openModal(modalContent, "scaleUpDown");
  };

  const createdDate = (() => {
    const date = new Date(stamp.block_time);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} ${hours === 1 ? "HOUR" : "HOURS"} AGO`;
    }

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

  const editionLabel = stamp.supply === 1 ? "EDITION" : "EDITIONS";
  /* ===== REFS AND UI STATE ===== */
  const [imageDimensions, setImageDimensions] = useState<DimensionsType | null>(
    null,
  );
  const [fileSize, setFileSize] = useState<number | null>(null);

  const fileExtension = stamp.stamp_url?.split(".")?.pop()?.toUpperCase() ||
    "UNKNOWN";

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, 8);

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

  /* ===== EFFECTS ===== */
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

  /* ===== EVENT HANDLERS ===== */
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

  /* ===== HELPER FUNCTIONS ===== */
  const handleContent = async () => {
    if (isSrc20Stamp()) {
      // Calculate size of JSON data for SRC-20 stamps
      const jsonData = stamp.stamp_base64;
      const blob = new Blob([jsonData], { type: "application/json" });
      setFileSize(blob.size);
    } else if (isSrc101Stamp()) {
      const res = await calculateTransactionSize(stamp.tx_hash);
      setFileSize(res);
    } else if (stamp.stamp_mimetype?.startsWith("image/")) {
      // Handle images
      const src = await getStampImageSrc(stamp);
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          unit: "px",
        });
      };
      img.src = src;

      fetch(src)
        .then((response) => response.blob())
        .then((blob) => setFileSize(blob.size))
        .catch((error) => console.error("Failed to fetch image size:", error));
    } else if (stamp.stamp_mimetype === "text/html") {
      // Handle HTML
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((html) => {
          const blob = new Blob([html], { type: "text/html" });
          setFileSize(blob.size);

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");

          const hasViewportMeta = doc.querySelector('meta[name="viewport"]');
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

            const getDimension = (style: string | null | undefined) => {
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
    } else if (
      stamp.stamp_mimetype?.startsWith("video/mpeg") ||
      stamp.stamp_mimetype?.startsWith("audio/mpeg") ||
      fileExtension === "MP3" ||
      fileExtension === "MP4" ||
      fileExtension === "MPEG"
    ) {
      // Handle MPEG files
      fetch(stamp.stamp_url)
        .then((response) => {
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            setFileSize(parseInt(contentLength, 10));
            return;
          }
          return response.blob();
        })
        .then((blob) => {
          if (blob instanceof Blob) {
            setFileSize(blob.size);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch MPEG size:", error);
          setFileSize(0);
        });
    } else if (stamp.stamp_mimetype === "text/plain") {
      // Handle plain text files
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((text) => {
          const blob = new Blob([text], { type: "text/plain" });
          setFileSize(blob.size);
        })
        .catch((error) => console.error("Failed to fetch text size:", error));
    } else if (
      stamp.stamp_mimetype === "text/javascript" ||
      stamp.stamp_mimetype === "application/javascript"
    ) {
      // Handle JS stamps
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((js) => {
          const blob = new Blob([js], { type: stamp.stamp_mimetype });
          setFileSize(blob.size);
        })
        .catch((error) => console.error("Failed to fetch JS size:", error));
    } else if (stamp.stamp_mimetype === "application/gzip") {
      // Handle GZIP stamps
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((content) => {
          const blob = new Blob([content], { type: "application/gzip" });
          setFileSize(blob.size);
        })
        .catch((error) => console.error("Failed to fetch GZIP size:", error));
    } else if (fileExtension === "BMN") {
      // Handle BMN files
      fetch(stamp.stamp_url)
        .then((response) => {
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            setFileSize(parseInt(contentLength, 10));
            return;
          }
          return response.text();
        })
        .then((content) => {
          if (typeof content === "string") {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(content);
            setFileSize(bytes.length);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch BMN size:", error);
          setFileSize(0);
        });
    } else if (!stamp?.stamp_mimetype && fileExtension !== "BMN") {
      console.log("Missing stamp_mimetype and not BMN:", {
        stamp_mimetype: stamp?.stamp_mimetype,
        stamp_url: stamp?.stamp_url,
      });
      return;
    }
  };

  useEffect(() => {
    handleContent();
  }, [stamp.stamp_mimetype, stamp.stamp_url, fileExtension]);

  /* ===== UTILITY FUNCTIONS ===== */
  // Format file size
  const formatFileSize = (size: number) => {
    if (stamp.stamp_mimetype === "text/plain") {
      return `${size} B`;
    }

    if (size < 1024) return size + " B";
    return (size / 1024).toFixed(1) + " KB";
  };

  // Format dimensions display
  const getDimensionsDisplay = (dims: DimensionsType | null) => {
    if (stamp.stamp_mimetype === "text/plain") {
      return "FIXED";
    }
    if (!dims) return "N/A";
    if (dims.unit === "responsive") return "RESPONSIVE";
    return `${dims.width} x ${dims.height} ${dims.unit.toUpperCase()}`;
  };

  /* ===== STATE ===== */
  // Add this state for HTML title
  const [htmlStampTitle, setHtmlStampTitle] = useState<string | null>(null);

  // Add this effect to extract HTML title
  useEffect(() => {
    if (stamp.stamp_mimetype === "text/html" && stamp.stamp_url) {
      fetch(stamp.stamp_url)
        .then((response) => response.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const title = doc.querySelector("title")?.textContent?.trim();
          if (title) {
            setHtmlStampTitle(title);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch HTML title:", error);
        });
    }
  }, [stamp.stamp_mimetype, stamp.stamp_url]);

  // Helper function to check if it's a POSH stamp (move near top of component)
  const isPoshStamp = (cpid: string) => {
    return !cpid?.startsWith("A");
  };

  const titleRef = useRef<HTMLParagraphElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = () => {
    if (titleRef.current) {
      const container = titleRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;

        // Set initial content to 50% to allow scaling up
        titleRef.current.style.width = "50%";
        const contentWidth = titleRef.current.scrollWidth;

        // Calculate base scale and limit to original size
        const baseScale = containerWidth / contentWidth;
        const maxScale = Math.min(baseScale, 1);
        setScale(maxScale);

        // Reset width to allow proper scaling
        titleRef.current.style.width = "";
      }
    }
  };

  useEffect(() => {
    updateScale();
    globalThis.addEventListener("resize", updateScale);
    return () => globalThis.removeEventListener("resize", updateScale);
  }, []);

  // Add another effect to recalculate when stamp data changes
  useEffect(() => {
    updateScale();
  }, [stamp.cpid, stamp.stamp, htmlStampTitle]);

  const [src101, setSrc101] = useState<Src101Detail>();
  const [showListings, setShowListings] = useState(false);
  const [dispensers, setDispensers] = useState<any[]>([]);
  const [isLoadingDispensers, setIsLoadingDispensers] = useState(false);
  const fetchDispensers = async (page: number) => {
    if (isLoadingDispensers) return;
    setIsLoadingDispensers(true);
    try {
      const encodedCpid = encodeURIComponent(stamp.cpid);
      const params = new URLSearchParams({
        limit: "20",
        sort: "DESC",
        page: page.toString(),
      });

      const response = await fetch(
        `/api/v2/stamps/${encodedCpid}/dispensers?${params}`,
      );

      if (!response.ok) {
        // 404 is expected when no dispensers exist - don't throw for this case
        if (response.status === 404) {
          setDispensers([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Simply filter for open status dispensers only
      const openDispensers = data.data.filter((d: any) => d.status === "open");

      setDispensers(openDispensers);
    } catch (error: any) {
      // Log all other errors (non-404)
      console.error("Error fetching dispensers:", error);
      setDispensers([]);
    } finally {
      setIsLoadingDispensers(false);
    }
  };

  const fetchSRC101 = async () => {
    try {
      const res = await getSRC101Data(stamp as StampRow);
      setSrc101(res);
    } catch (error: any) {
      console.log("Fetch SRC101 Error====>", error.message);
      setSrc101({} as Src101Detail);
    }
  };

  // Fetch dispensers when expanded
  useEffect(() => {
    fetchDispensers(1);
    fetchSRC101();
  }, []);

  // Add state for selected dispenser
  const [selectedDispenser, setSelectedDispenser] = useState<Dispenser | null>(
    null,
  );

  // Add btcPrice state with proper initialization
  const [btcPrice, setBtcPrice] = useState<number | null>(null);

  // Fetch BTC price when component mounts using centralized Redis-cached endpoint
  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        const price = await fetchBTCPriceInUSD();
        setBtcPrice(price);
      } catch (error) {
        console.error("Error fetching BTC price:", error);
        setBtcPrice(null);
      }
    };

    fetchBTCPrice();
  }, []);

  // First, ensure our calculations are correct
  const displayPrice = selectedDispenser
    ? parseInt(selectedDispenser.satoshirate.toString(), 10) / 100000000
    : (typeof stamp.floorPrice === "number" ? stamp.floorPrice : 0);

  const displayPriceUSD = selectedDispenser && btcPrice
    ? (parseInt(selectedDispenser.satoshirate.toString(), 10) / 100000000) *
      btcPrice
    : stamp.floorPriceUSD;

  // Debug effects for development only
  useEffect(() => {
    if (globalThis.location?.hostname === "localhost") {
      console.log("Price update:", {
        selectedDispenser,
        satoshirate: selectedDispenser?.satoshirate,
        displayPrice,
        displayPriceUSD,
        btcPrice,
      });
    }
  }, [selectedDispenser, btcPrice]);

  useEffect(() => {
    if (globalThis.location?.hostname === "localhost") {
      console.log("Price calculation values:", {
        selectedDispenser,
        satoshirate: selectedDispenser?.satoshirate,
        floorPrice: stamp.floorPrice,
        btcPrice,
        calculatedDisplayPrice: displayPrice,
        calculatedDisplayPriceUSD: displayPriceUSD,
      });
    }
  }, [selectedDispenser, btcPrice, stamp.floorPrice]);

  // Add handler for dispenser selection
  const handleDispenserSelect = (dispenser: Dispenser) => {
    const updatedDispenser = {
      ...dispenser,
      satoshirate: parseInt(dispenser.satoshirate.toString(), 10),
    };
    setSelectedDispenser(updatedDispenser);
  };

  // Development-only logging for initial checks
  const hasMultipleDispensers = dispensers?.length >= 2;
  if (globalThis.location?.hostname === "localhost") {
    console.log("Initial checks:", {
      dispensersLength: dispensers?.length,
      hasMultipleDispensers,
      showListings,
      hasFloorPrice: !!stamp.floorPrice,
      dispensers: dispensers,
    });
  }

  // Development-only useEffect to track dispensers state
  useEffect(() => {
    if (globalThis.location?.hostname === "localhost") {
      console.log("Dispensers state changed:", {
        dispensersLength: dispensers?.length,
        hasDispensers: dispensers?.length > 0,
        hasMultiple: dispensers?.length >= 2,
        rawDispensers: dispensers,
        floorPrice: stamp.floorPrice,
      });
    }
  }, [dispensers]);

  // Add new state for media duration
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);

  // Modify the format duration helper
  const formatDuration = (seconds: number): string => {
    // Less than 10 seconds - show milliseconds
    if (seconds < 10) {
      const milliseconds = Math.floor(seconds * 1000);
      return `${milliseconds} MS`;
    }

    // 10-59 seconds - show seconds
    if (seconds < 60) {
      return `${Math.floor(seconds)} SECONDS`;
    }

    // 60+ seconds - show MM:SS format
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Modify the useEffect to include duration fetching for media files
  useEffect(() => {
    if (
      stamp.stamp_mimetype?.startsWith("video/mpeg") ||
      stamp.stamp_mimetype?.startsWith("audio/mpeg") ||
      fileExtension === "MP3" ||
      fileExtension === "MP4" ||
      fileExtension === "MPEG"
    ) {
      const media = fileExtension === "MP3"
        ? new Audio()
        : document.createElement("video");
      media.src = stamp.stamp_url;

      media.onloadedmetadata = () => {
        setMediaDuration(media.duration);
      };

      media.onerror = () => {
        console.error("Failed to load media duration");
        setMediaDuration(null);
      };
    }
  }, [stamp.stamp_url, stamp.stamp_mimetype, fileExtension]);

  const isMediaFile = ["MP3", "MP4", "MPEG"].includes(fileExtension);

  const isSrc20Stamp = () => {
    return stamp.ident === "SRC-20";
  };

  const isSrc101Stamp = () => {
    return stamp.ident === "SRC-101";
  };

  // Effect to handle document title updates
  useEffect(() => {
    document.title = `Bitcoin Stamp #${stamp.stamp} - stampchain.io`;
    return () => {
      document.title = "stampchain.io";
    };
  }, [stamp.stamp]);

  /* ===== RENDER ===== */
  return (
    <>
      <SearchStampModal showButton={false} />
      <div className={`${body} ${gapSectionSlim}`}>
        <div
          className={containerBackground}
        >
          <div>
            <h2
              ref={titleRef}
              className={`${titleGreyLD} overflow-hidden`}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "left",
                width: `${(100 / scale)}%`,
                marginTop: `${-0.2 * (1 / scale - 1)}em`,
                marginBottom: `${-0.26 * (1 / scale - 1)}em`,
              }}
            >
              {isSrc101Stamp() && src101
                ? (
                  <span className="font-light">
                    {src101?.tokenid?.length && atob(src101?.tokenid[0])}
                  </span>
                )
                : isSrc20Stamp()
                ? (
                  <>
                    <span className="font-light">#</span>
                    <span className="font-black">{stamp.stamp}</span>
                  </>
                )
                : (isPoshStamp(stamp.cpid) ||
                    (htmlStampTitle && stamp.stamp_mimetype === "text/html"))
                ? (
                  <span className="font-black uppercase text-ellipsis overflow-hidden">
                    {isPoshStamp(stamp.cpid) ? stamp.cpid : htmlStampTitle}
                  </span>
                )
                : (
                  <>
                    <span className="font-light">#</span>
                    <span className="font-black">{stamp.stamp}</span>
                  </>
                )}
            </h2>

            {isSrc20Stamp() && stamp.cpid && (
              <h6 className={`${valueDark} -mt-1 pb-1 block`}>
                {stamp.cpid}
              </h6>
            )}

            <h5 className="-mt-1.5 font-light text-xl text-stamp-grey block">
              {(!isSrc20Stamp() && (isPoshStamp(stamp.cpid) ||
                (htmlStampTitle && stamp.stamp_mimetype === "text/html"))) && (
                <>
                  #{stamp.stamp}
                </>
              )}
            </h5>

            {(!isPoshStamp(stamp.cpid) && stamp.cpid) && (
              <h6 className={`${valueDark} block`}>
                {stamp.cpid}
              </h6>
            )}

            <div className="flex flex-col items-start pt-3">
              <h6 className={labelSm}>BY</h6>
              <a
                className={headingGreyDLLink}
                href={`/wallet/${stamp.creator}`}
                target="_parent"
              >
                {creatorDisplay}
              </a>
            </div>
          </div>

          {(dispensers?.length > 0 || stamp.floorPrice)
            ? (
              <div className="flex flex-col w-full pt-6 mobileLg:pt-12">
                <div
                  className={`flex w-full gap-6 mb-3 items-end ${
                    dispensers?.length >= 2 ? "justify-between" : "justify-end"
                  }`}
                >
                  {dispensers?.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => setShowListings(!showListings)}
                      className="pb-0.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        className="w-6 h-6 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                        role="button"
                        aria-label="Listings"
                      >
                        <path d="M4 8C4 7.73478 4.10536 7.48043 4.29289 7.29289C4.48043 7.10536 4.73478 7 5 7H27C27.2652 7 27.5196 7.10536 27.7071 7.29289C27.8946 7.48043 28 7.73478 28 8C28 8.26522 27.8946 8.51957 27.7071 8.70711C27.5196 8.89464 27.2652 9 27 9H5C4.73478 9 4.48043 8.89464 4.29289 8.70711C4.10536 8.51957 4 8.26522 4 8ZM5 17H12C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15H5C4.73478 15 4.48043 15.1054 4.29289 15.2929C4.10536 15.4804 4 15.7348 4 16C4 16.2652 4.10536 16.5196 4.29289 16.7071C4.48043 16.8946 4.73478 17 5 17ZM14 23H5C4.73478 23 4.48043 23.1054 4.29289 23.2929C4.10536 23.4804 4 23.7348 4 24C4 24.2652 4.10536 24.5196 4.29289 24.7071C4.48043 24.8946 4.73478 25 5 25H14C14.2652 25 14.5196 24.8946 14.7071 24.7071C14.8946 24.5196 15 24.2652 15 24C15 23.7348 14.8946 23.4804 14.7071 23.2929C14.5196 23.1054 14.2652 23 14 23ZM29.6362 17.9725L26.8213 20.2962L27.6787 23.76C27.7258 23.951 27.7154 24.1516 27.649 24.3367C27.5826 24.5218 27.463 24.6832 27.3053 24.8008C27.1476 24.9183 26.9588 24.9867 26.7624 24.9975C26.566 25.0083 26.3708 24.9609 26.2013 24.8612L23 22.9775L19.7987 24.8612C19.6292 24.9609 19.434 25.0083 19.2376 24.9975C19.0412 24.9867 18.8524 24.9183 18.6947 24.8008C18.537 24.6832 18.4174 24.5218 18.351 24.3367C18.2846 24.1516 18.2742 23.951 18.3213 23.76L19.1775 20.2962L16.3638 17.9725C16.2103 17.8456 16.0983 17.6758 16.0419 17.4848C15.9856 17.2938 15.9876 17.0903 16.0476 16.9005C16.1076 16.7106 16.2229 16.543 16.3788 16.4191C16.5347 16.2952 16.724 16.2206 16.9225 16.205L20.6525 15.9163L22.0812 12.6038C22.1585 12.4241 22.2866 12.271 22.4499 12.1635C22.6132 12.0559 22.8045 11.9986 23 11.9986C23.1955 11.9986 23.3868 12.0559 23.5501 12.1635C23.7134 12.271 23.8415 12.4241 23.9188 12.6038L25.3475 15.9163L29.0775 16.205C29.276 16.2206 29.4653 16.2952 29.6212 16.4191C29.7771 16.543 29.8924 16.7106 29.9524 16.9005C30.0124 17.0903 30.0144 17.2938 29.9581 17.4848C29.9018 17.6758 29.7897 17.8456 29.6362 17.9725ZM26.4525 18.0075L24.5912 17.8638C24.4097 17.8498 24.2354 17.7866 24.0871 17.6808C23.9389 17.5751 23.8223 17.4309 23.75 17.2638L23 15.5238L22.25 17.2638C22.1777 17.4309 22.0611 17.5751 21.9129 17.6808C21.7646 17.7866 21.5903 17.8498 21.4088 17.8638L19.5475 18.0075L20.9363 19.155C21.0817 19.2749 21.1903 19.4334 21.2496 19.6123C21.3089 19.7912 21.3164 19.9833 21.2712 20.1663L20.8337 21.9312L22.4925 20.955C22.6463 20.8644 22.8215 20.8167 23 20.8167C23.1785 20.8167 23.3537 20.8644 23.5075 20.955L25.1663 21.9312L24.7288 20.1663C24.6836 19.9833 24.6911 19.7912 24.7504 19.6123C24.8097 19.4334 24.9183 19.2749 25.0637 19.155L26.4525 18.0075Z" />
                      </svg>
                    </button>
                  )}

                  <div className="text-right">
                    {displayPriceUSD && (
                      <h6 className={labelSm}>
                        {displayPriceUSD.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })} <span className="font-light">USD</span>
                      </h6>
                    )}
                    <h6 className={value3xl}>
                      {formatBTCAmount(
                        typeof displayPrice === "number" ? displayPrice : 0,
                        { excludeSuffix: true },
                      )} <span className="font-extralight">BTC</span>
                    </h6>
                  </div>
                </div>

                {(dispensers?.length >= 2)
                  ? (
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out
                      ${
                        showListings
                          ? "max-h-[300px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="w-full mb-6">
                        {isLoadingDispensers
                          ? <h6>LOADING</h6>
                          : (
                            <StampListingsOpenTable
                              dispensers={dispensers}
                              floorPrice={typeof stamp.floorPrice === "number"
                                ? stamp.floorPrice
                                : 0}
                              onSelectDispenser={handleDispenserSelect}
                              selectedDispenser={selectedDispenser}
                            />
                          )}
                      </div>
                    </div>
                  )
                  : null}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    color="purple"
                    size="md"
                    onClick={() =>
                      toggleModal(selectedDispenser || lowestPriceDispenser)}
                  >
                    BUY
                  </Button>
                </div>
              </div>
            )
            : null}
        </div>

        <div className={containerBackground}>
          {!isSrc20Stamp() && (
            <div className="flex flex-col pb-3">
              <h6 className={labelSm}>{editionLabel}</h6>
              <h6 className={value3xl}>{editionCount}</h6>
            </div>
          )}

          <div className="flex flex-row">
            <div className={`${containerColData} flex-1 items-start`}>
              <h6 className={labelSm}>TYPE</h6>
              <h6 className={valueSm}>
                {isSrc20Stamp()
                  ? "SRC-20"
                  : isSrc101Stamp()
                  ? "SRC-101"
                  : fileExtension}
              </h6>
            </div>
            <div className={`${containerColData} flex-1 items-center`}>
              <h6 className={labelSm}>
                {(isSrc20Stamp() || isSrc101Stamp())
                  ? "TRANSACTION"
                  : isMediaFile
                  ? "DURATION"
                  : "DIMENSIONS"}
              </h6>
              <h6 className={valueSm}>
                {isSrc20Stamp()
                  ? stamp.stamp_base64 &&
                      JSON.parse(atob(stamp.stamp_base64))?.op === "DEPLOY"
                    ? "DEPLOY"
                    : stamp.stamp_base64 &&
                        JSON.parse(atob(stamp.stamp_base64))?.op === "MINT"
                    ? "MINT"
                    : "TRANSFER"
                  : isMediaFile
                  ? (mediaDuration ? formatDuration(mediaDuration) : "-")
                  : isSrc101Stamp()
                  ? stamp.stamp_base64 &&
                      JSON.parse(atob(stamp.stamp_base64))?.op === "DEPLOY"
                    ? "SALE"
                    : stamp.stamp_base64 &&
                        JSON.parse(atob(stamp.stamp_base64))?.op === "MINT"
                    ? "REGISTER"
                    : "TRANSFER"
                  : getDimensionsDisplay(imageDimensions)}
              </h6>
            </div>
            <div className="flex flex-1 justify-end items-end pb-1 space-x-[9px]">
              {stamp.divisible == true && (
                <div
                  className="relative group"
                  onMouseEnter={handleDivisibleMouseEnter}
                  onMouseLeave={handleDivisibleMouseLeave}
                >
                  <Icon
                    type="icon"
                    name="divisible"
                    weight="normal"
                    size="custom"
                    color="custom"
                    className="w-[23px] h-[23px] fill-stamp-grey-darker"
                    ariaLabel="Divisible"
                  />
                  <div
                    className={`${tooltipIcon} ${
                      isDivisibleTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
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
                  <Icon
                    type="icon"
                    name="keyburned"
                    weight="normal"
                    size="xs"
                    color="custom"
                    className="fill-stamp-grey-darker mb-0.5"
                    ariaLabel="Keyburned"
                  />
                  <div
                    className={`${tooltipIcon} ${
                      isKeyburnTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    KEYBURNED
                  </div>
                </div>
              )}
              {stamp.locked
                ? (
                  <div
                    className="relative group"
                    onMouseEnter={handleLockedMouseEnter}
                    onMouseLeave={handleLockedMouseLeave}
                  >
                    <Icon
                      type="icon"
                      name="locked"
                      weight="normal"
                      size="xs"
                      color="custom"
                      className="fill-stamp-grey-darker"
                      ariaLabel="Locked"
                    />
                    <div
                      className={`${tooltipIcon} ${
                        isLockedTooltipVisible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      LOCKED
                    </div>
                  </div>
                )
                : (
                  <div
                    className="relative group"
                    onMouseEnter={handleUnlockedMouseEnter}
                    onMouseLeave={handleUnlockedMouseLeave}
                  >
                    <Icon
                      type="icon"
                      name="unlocked"
                      weight="normal"
                      size="xs"
                      color="custom"
                      className="fill-stamp-grey-darker"
                      ariaLabel="Unlocked"
                    />
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

          <div className="flex flex-row pt-3">
            <div className={`${containerColData} flex-1 items-start`}>
              <h6 className={labelSm}>SIZE</h6>
              <h6 className={valueSm}>
                {fileSize !== null ? formatFileSize(fileSize) : "N/A"}
              </h6>
            </div>
            <div className={`${containerColData} flex-1 items-center`}>
              <h6 className={labelSm}>
                {isSrc20Stamp() ? "SENT" : "CREATED"}
              </h6>
              <h6 className={valueSm}>
                {createdDate}
              </h6>
            </div>
            {/* @baba - fix logic handling for no tx hash */}
            <div className={`${containerColData} flex-1 items-end`}>
              <h6 className={labelSm}>TX HASH</h6>
              <a
                href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${valueSm} hover:text-stamp-grey transition-colors duration-300`}
              >
                {stamp.tx_hash !== null
                  ? abbreviateAddress(stamp.tx_hash, 4)
                  : "N/A"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
