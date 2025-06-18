/* ===== STAMP IMAGE COMPONENT ===== */
/* @baba-update audio icon size (custom) - 780*/
import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";
import { StampRow } from "$globals";
import { getStampImageSrc, handleImageError } from "$lib/utils/imageUtils.ts";
import {
  AUDIO_FILE_IMAGE,
  LIBRARY_FILE_IMAGE,
  NOT_AVAILABLE_IMAGE,
} from "$lib/utils/constants.ts";
import TextContentIsland from "$islands/content/stampDetailContent/StampTextContent.tsx";
import PreviewCodeModal from "$islands/modal/PreviewCodeModal.tsx";
import PreviewImageModal from "$islands/modal/PreviewImageModal.tsx";
import { logger } from "$lib/utils/logger.ts";
import { tooltipIcon } from "$notification";
import { openModal } from "$islands/modal/states.ts";
import { Icon, LoadingIcon } from "$icon";
import { body, containerDetailImage, gapSectionSlim } from "$layout";

/* ===== RIGHT PANEL SUBCOMPONENT ===== */
function RightPanel(
  { stamp, toggleCodeModal, toggleFullScreenModal, showCodeButton }: {
    stamp: StampRow;
    toggleCodeModal: () => void;
    toggleFullScreenModal: () => void;
    showCodeButton: boolean;
  },
) {
  /* ===== STATE & REFS ===== */
  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const [isXTooltipVisible, setIsXTooltipVisible] = useState(false);
  const [allowXTooltip, setAllowXTooltip] = useState(true);
  const xButtonRef = useRef<HTMLDivElement>(null);
  const xTooltipTimeoutRef = useRef<number | null>(null);

  const [isShareTooltipVisible, setIsShareTooltipVisible] = useState(false);
  const [allowShareTooltip, setAllowShareTooltip] = useState(true);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const shareTooltipTimeoutRef = useRef<number | null>(null);

  // Add new state and refs for code tooltip
  const [isCodeTooltipVisible, setIsCodeTooltipVisible] = useState(false);
  const [allowCodeTooltip, setAllowCodeTooltip] = useState(true);
  const codeButtonRef = useRef<HTMLDivElement>(null);
  const codeTooltipTimeoutRef = useRef<number | null>(null);

  const [isFullscreenTooltipVisible, setIsFullscreenTooltipVisible] = useState(
    false,
  );
  const [allowFullscreenTooltip, setAllowFullscreenTooltip] = useState(true);
  const fullscreenButtonRef = useRef<HTMLDivElement>(null);
  const fullscreenTooltipTimeoutRef = useRef<number | null>(null);

  const [isToolsTooltipVisible, setIsToolsTooltipVisible] = useState(false);
  const toolsTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECTS ===== */
  useEffect(() => {
    return () => {
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }
      if (shareTooltipTimeoutRef.current) {
        globalThis.clearTimeout(shareTooltipTimeoutRef.current);
      }
      if (codeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(codeTooltipTimeoutRef.current);
      }
      if (fullscreenTooltipTimeoutRef.current) {
        globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
      }
    };
  }, []);

  /* ===== SHARING CONFIGURATION ===== */
  const url = `https://stampchain.io/stamp/${stamp.stamp}`;
  const text = "Check out what I found @Stampchain";

  const shareContent = async () => {
    const shareData = {
      title: text,
      text: text,
      url: url,
    };

    try {
      setIsShareTooltipVisible(false);
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Sharing is not supported in your browser.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  /* ===== EVENT HANDLERS ===== */
  const handleXMouseEnter = () => {
    if (allowXTooltip) {
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }

      xTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = xButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsXTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleXMouseLeave = () => {
    if (xTooltipTimeoutRef.current) {
      globalThis.clearTimeout(xTooltipTimeoutRef.current);
    }
    setIsXTooltipVisible(false);
    setAllowXTooltip(true);
  };

  const handleCopyMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = copyButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCopyMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setShowCopied(false);
    setAllowTooltip(true);
  };

  const shareToX = () => {
    const xShareUrl = `https://x.com/intent/post?text=${
      encodeURIComponent(text)
    }&url=${encodeURIComponent(url)}`;
    setIsXTooltipVisible(false);
    globalThis.open(xShareUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setIsTooltipVisible(false);
      setAllowTooltip(false);

      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setShowCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleShareMouseEnter = () => {
    if (allowShareTooltip) {
      if (shareTooltipTimeoutRef.current) {
        globalThis.clearTimeout(shareTooltipTimeoutRef.current);
      }

      shareTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = shareButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsShareTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleShareMouseLeave = () => {
    if (shareTooltipTimeoutRef.current) {
      globalThis.clearTimeout(shareTooltipTimeoutRef.current);
    }
    setIsShareTooltipVisible(false);
    setAllowShareTooltip(true);
  };

  // Add handlers for code tooltip
  const handleCodeMouseEnter = () => {
    if (allowCodeTooltip) {
      if (codeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(codeTooltipTimeoutRef.current);
      }

      codeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = codeButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsCodeTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCodeMouseLeave = () => {
    if (codeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(codeTooltipTimeoutRef.current);
    }
    setIsCodeTooltipVisible(false);
    setAllowCodeTooltip(true);
  };

  // Add handlers for fullscreen tooltip
  const handleFullscreenMouseEnter = () => {
    if (allowFullscreenTooltip) {
      if (fullscreenTooltipTimeoutRef.current) {
        globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
      }

      fullscreenTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = fullscreenButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsFullscreenTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleFullscreenMouseLeave = () => {
    if (fullscreenTooltipTimeoutRef.current) {
      globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
    }
    setIsFullscreenTooltipVisible(false);
    setAllowFullscreenTooltip(true);
  };

  const handleToolsMouseEnter = () => {
    if (toolsTooltipTimeoutRef.current) {
      globalThis.clearTimeout(toolsTooltipTimeoutRef.current);
    }
    toolsTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsToolsTooltipVisible(true);
    }, 1500);
  };

  const handleToolsMouseLeave = () => {
    if (toolsTooltipTimeoutRef.current) {
      globalThis.clearTimeout(toolsTooltipTimeoutRef.current);
    }
    setIsToolsTooltipVisible(false);
  };

  /* ===== RENDER ===== */
  return (
    <div className={`${containerDetailImage} flex justify-between`}>
      <div className="flex gap-[18px] tablet:gap-3">
        <div
          ref={copyButtonRef}
          class="relative"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <Icon
            type="iconButton"
            name="copy"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={copyLink}
          />
          <div
            class={`${tooltipIcon} ${
              isTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            COPY LINK
          </div>
          <div
            class={`${tooltipIcon} ${showCopied ? "opacity-100" : "opacity-0"}`}
          >
            LINK COPIED
          </div>
        </div>
        <div
          ref={xButtonRef}
          class="relative"
          onMouseEnter={handleXMouseEnter}
          onMouseLeave={handleXMouseLeave}
        >
          <Icon
            type="iconButton"
            name="twitter"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={shareToX}
            ariaLabel="Share on X"
          />
          <div
            class={`${tooltipIcon} ${
              isXTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            SHARE ON X
          </div>
        </div>
        <div
          ref={shareButtonRef}
          class="relative"
          onMouseEnter={handleShareMouseEnter}
          onMouseLeave={handleShareMouseLeave}
        >
          <Icon
            type="iconButton"
            name="share"
            weight="normal"
            size="custom"
            color="grey"
            className="w-[24px] h-[24px] tablet:w-6 tablet:h-6 mt-[1px]"
            onClick={shareContent}
            ariaLabel="Share content"
          />
          <div
            class={`${tooltipIcon} ${
              isShareTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            SHARE
          </div>
        </div>
      </div>
      <div className="flex gap-[18px] tablet:gap-3">
        {showCodeButton && (
          <div
            ref={codeButtonRef}
            class="relative"
            onMouseEnter={handleCodeMouseEnter}
            onMouseLeave={handleCodeMouseLeave}
          >
            <Icon
              type="iconButton"
              name="previewCode"
              weight="normal"
              size="mdR"
              color="grey"
              onClick={() => {
                setIsCodeTooltipVisible(false);
                toggleCodeModal();
              }}
              ariaLabel="View html code"
            />
            <div
              class={`${tooltipIcon} ${
                isCodeTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              VIEW CODE
            </div>
          </div>
        )}
        <div
          class="relative"
          onMouseEnter={handleToolsMouseEnter}
          onMouseLeave={handleToolsMouseLeave}
        >
          <Icon
            type="iconButton"
            name="previewImageRaw"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={() =>
              globalThis.open(
                `/s/${stamp.cpid}`,
                "targetWindow",
                `top=0,left=${
                  globalThis.screen.availWidth - 600
                },width=600,height=600,
                toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no`,
              )}
            ariaLabel="View raw stamp image in external window"
          />
          <div
            class={`${tooltipIcon} ${
              isToolsTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            VIEW EXTERNALLY
          </div>
        </div>
        <div
          ref={fullscreenButtonRef}
          class="relative"
          onMouseEnter={handleFullscreenMouseEnter}
          onMouseLeave={handleFullscreenMouseLeave}
        >
          <Icon
            type="iconButton"
            name="previewImage"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={() => {
              setIsFullscreenTooltipVisible(false);
              toggleFullScreenModal();
            }}
            ariaLabel="View image in fullscreen"
          />
          <div
            class={`${tooltipIcon} ${
              isFullscreenTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            VIEW FULLSCREEN
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN STAMP IMAGE COMPONENT ===== */
export function StampImage(
  { stamp, className, flag }: {
    stamp: StampRow;
    className?: string;
    flag?: boolean;
  },
) {
  /* ===== STATE & REFS ===== */
  const [loading, setLoading] = useState<boolean>(true);
  const imgScopeRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState("");
  const [src, setSrc] = useState("");

  const updateTransform = () => {
    if (!imgScopeRef.current) return;
    const width = imgScopeRef.current.clientWidth;
    setTransform(
      `scale(${(width + 50) / 648}))`,
    );
  };

  useEffect(() => {
    // Set initial transform
    updateTransform();

    // Add event listener to handle window resize
    globalThis.addEventListener("resize", updateTransform);

    // Cleanup event listener on component unmount
    return () => {
      globalThis.removeEventListener("resize", updateTransform);
    };
  }, []);

  const toggleFullScreenModal = () => {
    const modalContent = (
      <PreviewImageModal
        src={src}
        contentType={stamp.stamp_mimetype === "text/html"
          ? "html"
          : stamp.stamp_mimetype === "text/plain"
          ? "text"
          : stamp.stamp_mimetype?.startsWith("audio/")
          ? "audio"
          : "image"}
      />
    );
    openModal(modalContent, "zoomInOut");
  };

  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(stamp);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  useEffect(() => {
    fetchStampImage().catch((error) => {
      console.error("Error fetching stamp image:", error);
      setLoading(false); // Ensure loading is set to false even on error
    });
  }, []);

  const isHtml = stamp.stamp_mimetype === "text/html";
  const isPlainText = stamp.stamp_mimetype === "text/plain";
  const isAudio = stamp.stamp_mimetype?.startsWith("audio/");
  const isLibraryFile = stamp.stamp_mimetype === "text/css" ||
    stamp.stamp_mimetype === "text/javascript" ||
    stamp.stamp_mimetype === "application/javascript" ||
    stamp.stamp_mimetype === "application/gzip";

  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  useEffect(() => {
    if (isHtml) {
      fetchHtmlContent();
    }
  }, [stamp]);

  const fetchHtmlContent = async () => {
    try {
      // Use the API endpoint to get raw stamp content instead of the rendered webpage
      const response = await fetch(`/api/v2/stamps/${stamp.stamp}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stampData = await response.json();

      // Decode the base64 stamp content to get the raw HTML with proper UTF-8 handling
      if (stampData.data?.stamp?.stamp_base64) {
        // Properly decode base64 with UTF-8 support for emojis
        const binaryString = atob(stampData.data.stamp.stamp_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decodedContent = new TextDecoder("utf-8").decode(bytes);
        setHtmlContent(decodedContent);
      } else {
        console.log("No stamp_base64 found in API response:", stampData);
        setHtmlContent(null);
      }
    } catch (error) {
      console.error("Failed to fetch HTML content:", error);
      setHtmlContent(null);
    }
  };

  const [validatedContent, setValidatedContent] = useState<VNode | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml" && src) {
        setIsValidating(true);

        try {
          // Fetch the SVG content
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
          }

          const svgContent = await response.text();

          // Check if SVG has external ordinals.com references
          if (svgContent.includes("ordinals.com/content/")) {
            // Rewrite external references to use our proxy
            let rewrittenSVG = svgContent.replace(
              /https:\/\/ordinals\.com\/content\/([^"'\s>]+)/g,
              "/api/proxy/ordinals/$1",
            );

            // Ensure SVG fills container by removing fixed dimensions and adding proper styling
            if (rewrittenSVG.includes("<svg")) {
              // Remove width and height attributes
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)\s+width="([^"]*)"([^>]*)/,
                "<svg$1$3",
              ).replace(
                /<svg([^>]*)\s+height="([^"]*)"([^>]*)/,
                "<svg$1$3",
              );

              // Add viewBox if not present (using the original dimensions)
              if (!rewrittenSVG.includes("viewBox")) {
                rewrittenSVG = rewrittenSVG.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 viewBox="0 0 460 500">',
                );
              }

              // Add responsive styling to fill container properly
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;">',
              );
            }

            setValidatedContent(
              <div
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: rewrittenSVG }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />,
            );
          } else {
            // No external references, use original src
            setValidatedContent(
              <img
                width="100%"
                loading="lazy"
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                src={src}
                onError={handleImageError}
                alt={`Stamp No. ${stamp.stamp}`}
              />,
            );
          }
        } catch (_error) {
          // Fallback to original src
          setValidatedContent(
            <img
              width="100%"
              loading="lazy"
              className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
              src={src}
              onError={handleImageError}
              alt={`Stamp No. ${stamp.stamp}`}
            />,
          );
        }

        setIsValidating(false);
      } else {
        setIsValidating(false);
      }
    };
    validateContent();
  }, [src, stamp.stamp_mimetype]);

  // All tooltip-related refs
  const tooltipTimeoutRef = useRef<number | null>(null);
  const copyTooltipTimeoutRef = useRef<number | null>(null);
  const shareTooltipTimeoutRef = useRef<number | null>(null);
  const codeTooltipTimeoutRef = useRef<number | null>(null);
  const fullscreenTooltipTimeoutRef = useRef<number | null>(null);

  // Add cleanup effect for tooltips
  useEffect(() => {
    logger.debug("ui", {
      message: "StampImage mounted",
      component: "StampImage",
    });

    return () => {
      logger.debug("ui", {
        message: "StampImage unmounting",
        component: "StampImage",
      });
      // Clean up all tooltip timeouts
      [
        tooltipTimeoutRef,
        copyTooltipTimeoutRef,
        shareTooltipTimeoutRef,
        codeTooltipTimeoutRef,
        fullscreenTooltipTimeoutRef,
        xTooltipTimeoutRef,
      ].forEach((ref) => {
        if (ref.current !== null) {
          globalThis.clearTimeout(ref.current);
          ref.current = null;
        }
      });
    };
  }, []);

  const xTooltipTimeoutRef = useRef<number | null>(null);

  // Add to cleanup useEffect
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }
    };
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Update the toggleCodeModal function to use the new pattern
  const toggleCodeModal = () => {
    const modalContent = (
      <PreviewCodeModal
        src={htmlContent || src}
      />
    );
    openModal(modalContent, "zoomInOut");
  };

  const isLoadingOrValidating = loading ||
    (stamp.stamp_mimetype === "image/svg+xml" && isValidating);

  if (isLoadingOrValidating) {
    return (
      <div class={`${body} ${gapSectionSlim}`}>
        <div className={containerDetailImage}>
          <div className="stamp-container">
            <LoadingIcon containerClassName="rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {src === NOT_AVAILABLE_IMAGE && (
        <div className="stamp-container">
          <img
            width="100%"
            loading="lazy"
            className={`max-w-none object-contain rounded ${className} pixelart stamp-image`}
            src={src}
            alt="Not Available"
          />
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isHtml && (
        <div className={`${className} ${body} ${gapSectionSlim}`}>
          <div className={`relative ${flag ? containerDetailImage : ""}`}>
            <div className="stamp-container">
              <div className="relative pt-[100%]">
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  className={`${
                    className || ""
                  } rounded absolute top-0 left-0 pointer-events-none`}
                  sandbox="allow-scripts allow-same-origin"
                  src={src || ""}
                  loading="lazy"
                  style={{ transform: transform || "none" }}
                  onError={handleImageError}
                  title="Stamp"
                />
                <div className="absolute inset-0 cursor-pointer" />
              </div>
            </div>
          </div>
          {flag && (
            <RightPanel
              stamp={stamp}
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton
            />
          )}
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isPlainText && (
        <div class={`${body} ${gapSectionSlim}`}>
          <div className={containerDetailImage}>
            <div className="stamp-container">
              <div className="relative aspect-square">
                <TextContentIsland src={src} />
              </div>
            </div>
          </div>
          {flag && (
            <RightPanel
              stamp={stamp}
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton={false}
            />
          )}
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isAudio && (
        <div className={`${className} ${body} ${gapSectionSlim}`}>
          <div className={containerDetailImage}>
            <div className="stamp-container relative group">
              <img
                src={AUDIO_FILE_IMAGE}
                alt="Audio File"
                className="absolute top-0 left-0 w-full h-full object-contain rounded pixelart stamp-image pointer-events-none select-none"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <audio
                  ref={audioRef}
                  className="hidden"
                  onEnded={handleAudioEnded}
                >
                  <source src={src} type={stamp.stamp_mimetype} />
                </audio>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[10%] h-[10%] rounded-full flex items-center justify-center group/button"
                >
                  <div className="absolute inset-0 bg-black opacity-50 rounded-full" />
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    type="iconButton"
                    weight="bold"
                    size="xxl"
                    color="custom"
                    className="p-[25%] relative z-10 fill-stamp-grey group-hover/button:fill-stamp-grey-light transition-all duration-300"
                  />
                </button>
              </div>
            </div>
          </div>
          {flag && (
            <RightPanel
              stamp={stamp}
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton={false}
            />
          )}
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isLibraryFile && (
        <div className={`${className} ${body} ${gapSectionSlim}`}>
          <div className={containerDetailImage}>
            <div className="stamp-container relative group">
              <img
                src={LIBRARY_FILE_IMAGE}
                alt="Library File"
                className="absolute top-0 left-0 w-full h-full object-contain rounded pixelart stamp-image pointer-events-none select-none"
                draggable={false}
              />
            </div>
          </div>
          {flag && (
            <RightPanel
              stamp={stamp}
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton={false}
            />
          )}
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && !isHtml && !isPlainText && !isAudio &&
        !isLibraryFile && (
          flag
            ? (
              <div class={`${body} ${gapSectionSlim}`}>
                <div className={containerDetailImage}>
                  <div className="stamp-container">
                    <div className="relative z-10 aspect-square flex items-center justify-center">
                      {validatedContent || (
                        <img
                          width="100%"
                          loading="lazy"
                          className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                          src={src}
                          onError={handleImageError}
                          alt="Stamp"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {stamp.ident !== "SRC-20" && (
                  <RightPanel
                    stamp={stamp}
                    toggleCodeModal={toggleCodeModal}
                    toggleFullScreenModal={toggleFullScreenModal}
                    showCodeButton={false}
                  />
                )}
              </div>
            )
            : (
              <div className={containerDetailImage}>
                <div className="stamp-container">
                  <div className="relative z-10 aspect-square flex items-center justify-center">
                    {validatedContent || (
                      <img
                        width="100%"
                        loading="lazy"
                        className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                        src={src}
                        onError={handleImageError}
                        alt="Stamp"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
        )}
    </>
  );
}

export default StampImage;
