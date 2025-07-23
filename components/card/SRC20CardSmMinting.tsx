/* reinamora - update Trending calculations */
import { Button } from "$button";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { EnrichedSRC20Row } from "$globals";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
  Timeframe,
} from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { constructStampUrl } from "$lib/utils/imageUtils.ts";
import { labelXs, textSm, valueDarkSm } from "$text";

interface SRC20CardSmMintingProps {
  data: EnrichedSRC20Row[];
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: Timeframe;
  onImageClick: (imgSrc: string) => void;
}

export function SRC20CardSmMinting({
  data,
  onImageClick,
}: SRC20CardSmMintingProps) {
  const headers = [
    "TOKEN",
    "MINTS",
    "PROGRESS",
    "HOLDERS",
    "", // MINT button
  ];

  function splitTextAndEmojis(text: string): { text: string; emoji: string } {
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu;
    const match = text.match(emojiRegex);
    if (!match) return { text, emoji: "" };
    const emojiIndex = text.indexOf(match[0]);
    return {
      text: text.slice(0, emojiIndex),
      emoji: text.slice(emojiIndex),
    };
  }

  return (
    <table class={`w-full ${textSm} border-separate border-spacing-y-3 -mt-8`}>
      <colgroup>
        {colGroup([
          {
            width:
              "w-[28%] min-[600px]:w-[22%] tablet:w-[35%] min-[1280px]:w-[22%]",
          }, // TOKEN
          {
            width:
              "hidden min-[600px]:w-[16%] tablet:hidden min-[1280px]:w-[12%]",
          }, // MINTS
          {
            width:
              "w-[32%] min-[600px]:w-[16%] tablet:w-[28%] min-[1280px]:w-[20%]",
          }, // PROGRESS
          {
            width:
              "w-[17%] min-[600px]:w-[16%] tablet:w-[20%] min-[1280px]:w-[18%]",
          }, // HOLDERS
          {
            width:
              "w-[23%] min-[600px]:w-[30%] tablet:w-[17%] min-[1280px]:w-[28%]",
          }, // MINT button
        ]).map((col) => <col key={col.key} class={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers.length)} ${
                i === 1
                  ? "hidden min-[600px]:table-cell tablet:hidden min-[1280px]:table-cell"
                  : "" // MINTS
              }`}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length
          ? (
            data.map((src20) => {
              // SRC-20 Image URL Logic:
              // 1. Use deploy_img if provided (for deploy operations: https://stampchain.io/stamps/{deploy_tx}.svg)
              // 2. Use stamp_url if provided (for transaction stamps: https://stampchain.io/stamps/{tx_hash}.svg)
              // 3. Fallback to constructing URL from deploy_tx if available
              // 4. Final fallback to placeholder image
              const imageUrl = src20.deploy_img ||
                src20.stamp_url ||
                (src20.deploy_tx ? constructStampUrl(src20.deploy_tx) : null) ||
                "/img/placeholder/stamp-no-image.svg";

              const href = `/src20/${
                encodeURIComponent(unicodeEscapeToEmoji(src20.tick))
              }`;

              const mintHref = `/tool/src20/mint?tick=${
                encodeURIComponent(src20.tick)
              }&trxType=olga`;

              const handleMintClick = (event: MouseEvent) => {
                event.preventDefault();

                // SSR-safe browser environment check
                if (
                  typeof globalThis === "undefined" || !globalThis?.location
                ) {
                  return; // Cannot navigate during SSR
                }

                // Check if we're already on the mint page
                const currentPath = globalThis.location.pathname;
                const isMintPage = currentPath.includes("/tool/src20/mint");

                if (isMintPage) {
                  // If we're on the mint page, update URL parameters to populate form
                  const newUrl = new URL(globalThis.location.href);
                  newUrl.searchParams.set("tick", src20.tick);
                  newUrl.searchParams.set("trxType", "olga");
                  globalThis.history.replaceState({}, "", newUrl.toString());

                  // Trigger a custom event that the MintTool can listen to
                  globalThis.dispatchEvent(
                    new CustomEvent("mintTokenSelected", {
                      detail: { tick: src20.tick },
                    }),
                  );
                } else {
                  // Otherwise, navigate to mint page with parameters
                  globalThis.location.href = mintHref;
                }
              };

              return (
                <tr
                  key={src20.tx_hash}
                  class={`${containerCardTable} cursor-pointer group`}
                >
                  {/* TOKEN */}
                  <td
                    class={`${
                      cellAlign(0, headers.length)
                    } ${rowCardBorderLeft}`}
                  >
                    <div class="flex items-center gap-4">
                      <img
                        src={imageUrl}
                        class="hidden min-[420px]:flex w-7 h-7 rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onImageClick?.(imageUrl);
                        }}
                        alt={unicodeEscapeToEmoji(src20.tick)}
                      />
                      <div class="flex flex-col">
                        <div class="font-bold text-base uppercase tracking-wide">
                          {(() => {
                            const { text, emoji } = splitTextAndEmojis(
                              unicodeEscapeToEmoji(src20.tick),
                            );
                            return (
                              <>
                                {text && (
                                  <a
                                    href={href}
                                    onClick={(e) => {
                                      if (
                                        !e.ctrlKey && !e.metaKey &&
                                        e.button !== 1
                                      ) {
                                        e.preventDefault();
                                        // SSR-safe browser environment check
                                        if (
                                          typeof globalThis === "undefined" ||
                                          !globalThis?.location
                                        ) {
                                          return; // Cannot navigate during SSR
                                        }
                                        globalThis.location.href = href;
                                      }
                                    }}
                                  >
                                    <span class="gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] inline-block transition-colors duration-300">
                                      {text.toUpperCase()}
                                    </span>
                                  </a>
                                )}
                                {emoji && (
                                  <span class="emoji-ticker">{emoji}</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* MINTS */}
                  <td
                    class={`${
                      cellAlign(1, headers.length)
                    } ${rowCardBorderCenter} hidden min-[600px]:table-cell tablet:hidden min-[1280px]:table-cell`}
                  >
                    {src20.mint_progress?.total_mints || src20.mint_count ||
                      "N/A"}
                  </td>
                  {/* PROGRESS */}
                  <td
                    class={`${
                      cellAlign(2, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    <div class="flex items-center justify-center w-full">
                      <div class="flex flex-col w-[100px] min-[420px]:w-[120px] mobileLg:w-[160px] tablet:w-[120px] desktop:w-[160px] gap-1">
                        <div class="!text-xs text-center">
                          {(() => {
                            // ✅ FIXED: Use the same data access pattern as SRC20CardMinting
                            const progressRaw = src20.mint_progress?.progress ||
                              src20.progress;
                            if (
                              progressRaw === undefined || progressRaw === null
                            ) {
                              return "0";
                            }
                            const progressValue = Number(progressRaw);
                            if (isNaN(progressValue)) {
                              return "0";
                            }
                            return progressValue.toFixed(1);
                          })()}
                          <span class="text-stamp-grey-light">%</span>
                        </div>
                        <div class="relative h-1.5 bg-stamp-grey rounded-full">
                          <div
                            class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
                            style={{
                              width: `${
                                (() => {
                                  // ✅ FIXED: Use the same data access pattern as SRC20CardMinting
                                  const progressRaw =
                                    src20.mint_progress?.progress ||
                                    src20.progress;
                                  if (
                                    progressRaw === undefined ||
                                    progressRaw === null
                                  ) {
                                    return 0;
                                  }
                                  const progressValue = Number(progressRaw);
                                  if (isNaN(progressValue)) {
                                    return 0;
                                  }
                                  return Math.min(
                                    100,
                                    Math.max(0, progressValue),
                                  );
                                })()
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* HOLDERS */}
                  <td
                    class={`${
                      cellAlign(3, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {(() => {
                      // ✅ FIXED: Use the same data access pattern as SRC20CardMinting
                      const holderCount =
                        (src20 as any)?.market_data?.holder_count ||
                        (src20 as any)?.holders ||
                        0;
                      return Number(holderCount).toLocaleString();
                    })()}
                  </td>
                  {/* MINT BUTTON */}
                  <td
                    class={`${
                      cellAlign(4, headers.length)
                    } ${rowCardBorderRight}`}
                  >
                    <Button
                      variant="outline"
                      color="custom"
                      size="xs"
                      class="[--default-color:#999999] [--hover-color:#AA00FF]"
                      href={mintHref}
                      onClick={handleMintClick}
                    >
                      MINT
                    </Button>
                  </td>
                </tr>
              );
            })
          )
          : (
            <tr>
              <td colSpan={headers.length} class={`${valueDarkSm} w-full`}>
                NO MINTING TOKENS
              </td>
            </tr>
          )}
      </tbody>
    </table>
  );
}
