/* ===== STAMP INFO COMPONENT ===== */
/*@baba-750+764+815+icons*/
import { useEffect, useRef, useState } from "preact/hooks";
import BuyStampModal from "$islands/modal/BuyStampModal.tsx";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatDate,
} from "$lib/utils/formatUtils.ts";
import { getSRC101Data, getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { Src101Detail, StampRow } from "$globals";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { StampListingsOpen } from "$components/stampDetails/StampListingsOpen.tsx";
import type { Dispenser } from "$components/stampDetails/StampListingsOpen.tsx";
import { calculateTransactionSize } from "$lib/utils/identifierUtils.ts";
import { containerBackground, containerColData } from "$layout";
import {
  label,
  labelSm,
  textSm,
  textXl,
  titleGreyLD,
  value3xl,
  valueDark,
} from "$text";
import { Button } from "$button";
import { tooltipIcon } from "$notification";

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const toggleModal = (dispenser?: Dispenser) => {
    if (dispenser) {
      setSelectedDispenser(dispenser);
    }
    setIsModalOpen(!isModalOpen);
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

  const editionLabel = stamp.supply === 1 ? "edition" : "editions";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Simply filter for open status dispensers only
      const openDispensers = data.data.filter((d: any) => d.status === "open");

      setDispensers(openDispensers);
    } catch (error) {
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

  // Fetch BTC price when component mounts
  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        );
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
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

  // Add debug effect to track price updates
  useEffect(() => {
    console.log("Price update:", {
      selectedDispenser,
      satoshirate: selectedDispenser?.satoshirate,
      displayPrice,
      displayPriceUSD,
      btcPrice,
    });
  }, [selectedDispenser, btcPrice]);

  // Add debug logs to track state changes
  useEffect(() => {
    console.log("Price calculation values:", {
      selectedDispenser,
      satoshirate: selectedDispenser?.satoshirate,
      floorPrice: stamp.floorPrice,
      btcPrice,
      calculatedDisplayPrice: displayPrice,
      calculatedDisplayPriceUSD: displayPriceUSD,
    });
  }, [selectedDispenser, btcPrice, stamp.floorPrice]);

  // Add handler for dispenser selection
  const handleDispenserSelect = (dispenser: Dispenser) => {
    const updatedDispenser = {
      ...dispenser,
      satoshirate: parseInt(dispenser.satoshirate.toString(), 10),
    };
    setSelectedDispenser(updatedDispenser);
  };

  // At the top of component, add logging for initial check
  const hasMultipleDispensers = dispensers?.length >= 2;
  console.log("Initial checks:", {
    dispensersLength: dispensers?.length,
    hasMultipleDispensers,
    showListings,
    hasFloorPrice: !!stamp.floorPrice,
    dispensers: dispensers,
  });

  // Add this useEffect to track dispensers state
  useEffect(() => {
    console.log("Dispensers state changed:", {
      dispensersLength: dispensers?.length,
      hasDispensers: dispensers?.length > 0,
      hasMultiple: dispensers?.length >= 2,
      rawDispensers: dispensers,
      floorPrice: stamp.floorPrice,
    });
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
      <StampSearchClient
        open2={isSearchOpen}
        handleOpen2={setIsSearchOpen}
        showButton={false}
      />

      <div className={"flex flex-col gap-6"}>
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

            <h5 className={`${textXl} -mt-1.5 block`}>
              {(!isSrc20Stamp() && (isPoshStamp(stamp.cpid) ||
                (htmlStampTitle && stamp.stamp_mimetype === "text/html"))) && (
                <>
                  <span className="font-light">#</span>
                  <span className="font-light">{stamp.stamp}</span>
                </>
              )}
            </h5>

            {(!isPoshStamp(stamp.cpid) && stamp.cpid) && (
              <h6 className={`${valueDark} block`}>
                {stamp.cpid}
              </h6>
            )}

            <div className="flex flex-col items-start pt-1.5 mobileLg:pt-3">
              <h6 className={label}>BY</h6>
              <a
                className="font-black text-xl gray-gradient3-hover -mt-1"
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
                  className={`flex w-full gap-3 mobileLg:gap-6 mb-3 mobileLg:mb-6 items-end ${
                    dispensers?.length >= 2 ? "justify-between" : "justify-end"
                  }`}
                >
                  {dispensers?.length >= 2 && (
                    <button
                      onClick={() => setShowListings(!showListings)}
                      className="pb-1.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        className="w-6 h-6 mobileLg:w-[28px] mobileLg:h-[28px] fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
                        role="button"
                        aria-label="Listings"
                      >
                        <path d="M4 8C4 7.73478 4.10536 7.48043 4.29289 7.29289C4.48043 7.10536 4.73478 7 5 7H27C27.2652 7 27.5196 7.10536 27.7071 7.29289C27.8946 7.48043 28 7.73478 28 8C28 8.26522 27.8946 8.51957 27.7071 8.70711C27.5196 8.89464 27.2652 9 27 9H5C4.73478 9 4.48043 8.89464 4.29289 8.70711C4.10536 8.51957 4 8.26522 4 8ZM5 17H12C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16C13 15.7348 12.8946 15.4804 12.7071 15.2929C12.5196 15.1054 12.2652 15 12 15H5C4.73478 15 4.48043 15.1054 4.29289 15.2929C4.10536 15.4804 4 15.7348 4 16C4 16.2652 4.10536 16.5196 4.29289 16.7071C4.48043 16.8946 4.73478 17 5 17ZM14 23H5C4.73478 23 4.48043 23.1054 4.29289 23.2929C4.10536 23.4804 4 23.7348 4 24C4 24.2652 4.10536 24.5196 4.29289 24.7071C4.48043 24.8946 4.73478 25 5 25H14C14.2652 25 14.5196 24.8946 14.7071 24.7071C14.8946 24.5196 15 24.2652 15 24C15 23.7348 14.8946 23.4804 14.7071 23.2929C14.5196 23.1054 14.2652 23 14 23ZM29.6362 17.9725L26.8213 20.2962L27.6787 23.76C27.7258 23.951 27.7154 24.1516 27.649 24.3367C27.5826 24.5218 27.463 24.6832 27.3053 24.8008C27.1476 24.9183 26.9588 24.9867 26.7624 24.9975C26.566 25.0083 26.3708 24.9609 26.2013 24.8612L23 22.9775L19.7987 24.8612C19.6292 24.9609 19.434 25.0083 19.2376 24.9975C19.0412 24.9867 18.8524 24.9183 18.6947 24.8008C18.537 24.6832 18.4174 24.5218 18.351 24.3367C18.2846 24.1516 18.2742 23.951 18.3213 23.76L19.1775 20.2962L16.3638 17.9725C16.2103 17.8456 16.0983 17.6758 16.0419 17.4848C15.9856 17.2938 15.9876 17.0903 16.0476 16.9005C16.1076 16.7106 16.2229 16.543 16.3788 16.4191C16.5347 16.2952 16.724 16.2206 16.9225 16.205L20.6525 15.9163L22.0812 12.6038C22.1585 12.4241 22.2866 12.271 22.4499 12.1635C22.6132 12.0559 22.8045 11.9986 23 11.9986C23.1955 11.9986 23.3868 12.0559 23.5501 12.1635C23.7134 12.271 23.8415 12.4241 23.9188 12.6038L25.3475 15.9163L29.0775 16.205C29.276 16.2206 29.4653 16.2952 29.6212 16.4191C29.7771 16.543 29.8924 16.7106 29.9524 16.9005C30.0124 17.0903 30.0144 17.2938 29.9581 17.4848C29.9018 17.6758 29.7897 17.8456 29.6362 17.9725ZM26.4525 18.0075L24.5912 17.8638C24.4097 17.8498 24.2354 17.7866 24.0871 17.6808C23.9389 17.5751 23.8223 17.4309 23.75 17.2638L23 15.5238L22.25 17.2638C22.1777 17.4309 22.0611 17.5751 21.9129 17.6808C21.7646 17.7866 21.5903 17.8498 21.4088 17.8638L19.5475 18.0075L20.9363 19.155C21.0817 19.2749 21.1903 19.4334 21.2496 19.6123C21.3089 19.7912 21.3164 19.9833 21.2712 20.1663L20.8337 21.9312L22.4925 20.955C22.6463 20.8644 22.8215 20.8167 23 20.8167C23.1785 20.8167 23.3537 20.8644 23.5075 20.955L25.1663 21.9312L24.7288 20.1663C24.6836 19.9833 24.6911 19.7912 24.7504 19.6123C24.8097 19.4334 24.9183 19.2749 25.0637 19.155L26.4525 18.0075Z" />
                      </svg>
                    </button>
                  )}

                  <div className="text-right">
                    {displayPriceUSD && (
                      <h6 className={label}>
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
                    showListings && (
                      <div className="w-full mb-3 mobileLg:mb-6">
                        {isLoadingDispensers
                          ? <h6>LOADING</h6>
                          : (
                            <StampListingsOpen
                              dispensers={dispensers}
                              floorPrice={typeof stamp.floorPrice === "number"
                                ? stamp.floorPrice
                                : 0}
                              onSelectDispenser={handleDispenserSelect}
                              selectedDispenser={selectedDispenser}
                            />
                          )}
                      </div>
                    )
                  )
                  : null}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    color="purple"
                    size="lg"
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
            <div className="flex flex-col pb-3 mobileLg:pb-6">
              <h6 className={label}>{editionLabel}</h6>
              <h6 className={value3xl}>{editionCount}{" "}</h6>
            </div>
          )}

          <div className="flex flex-row">
            <div className={`${containerColData} flex-1 items-start`}>
              <h6 className={labelSm}>TYPE</h6>
              <h6 className={textSm}>
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
              <h6 className={textSm}>
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
              {stamp.locked && (
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
              {!stamp.locked && (
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
            <div className={`${containerColData} flex-1 items-start`}>
              <h6 className={labelSm}>SIZE</h6>
              <h6 className={textSm}>
                {fileSize !== null ? formatFileSize(fileSize) : "N/A"}
              </h6>
            </div>
            <div className={`${containerColData} flex-1 items-center`}>
              <h6 className={labelSm}>
                {isSrc20Stamp() ? "SENT" : "CREATED"}
              </h6>
              <h6 className={textSm}>
                {createdDate}
              </h6>
            </div>
            <div className={`${containerColData} flex-1 items-end`}>
              <h6 className={labelSm}>TX HASH</h6>
              <a
                href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${textSm} hover:text-stamp-grey transition-colors duration-300`}
              >
                {abbreviateAddress(stamp.tx_hash, 4)}
              </a>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <BuyStampModal
            stamp={stamp}
            fee={fee}
            handleChangeFee={handleChangeFee}
            toggleModal={() => setIsModalOpen(false)}
            handleCloseModal={handleCloseModal}
            dispenser={selectedDispenser || lowestPriceDispenser}
          />
        )}
      </div>
    </>
  );
}
