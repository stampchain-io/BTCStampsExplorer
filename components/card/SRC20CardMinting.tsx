/* reinamora - update Trending calculations */
import { Button } from "$button";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { SRC20Row } from "$types/src20.d.ts";
import type { SRC20CardMintingProps } from "$types/ui.d.ts";
import { Icon } from "$icon";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
  Timeframe,
} from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import { formatDate } from "$lib/utils/ui/formatting/formatUtils.ts";
import { constructStampUrl } from "$lib/utils/ui/media/imageUtils.ts";
import { labelXs, textSm, valueDarkSm } from "$text";

export function SRC20CardMinting({
  data,
  fromPage: _fromPage,
  timeframe,
  onImageClick,
  currentSort,
}: SRC20CardMintingProps) {
  const headers = [
    "TOKEN",
    "MINTS",
    "PROGRESS",
    "TRENDING",
    "DEPLOY",
    "HOLDERS",
    "", // MINT button
  ];

  // Helper function to handle header clicks for sorting
  const handleHeaderClick = (headerName: string) => {
    // Skip sorting for empty header (MINT button) and TRENDING (leave for now as requested)
    if (headerName === "" || headerName === "TRENDING") {
      return;
    }

    // Map header names to API sort parameters
    const sortMapping: Record<string, string> = {
      "TOKEN": "TOKEN", // Add TOKEN for alphabetical sorting
      "MINTS": "MINTS",
      "PROGRESS": "PROGRESS",
      "DEPLOY": "DEPLOY",
      "HOLDERS": "HOLDERS",
    };

    const apiSortKey = sortMapping[headerName];
    if (!apiSortKey) return;

    // Determine new direction
    const isCurrentSort = currentSort?.filter === apiSortKey;
    const newDirection = isCurrentSort && currentSort.direction === "desc"
      ? "asc"
      : "desc";

    // Navigate with new sort parameters
    if (typeof globalThis !== "undefined" && globalThis?.location) {
      // Use location.href safely with SSR guard
      const currentHref = globalThis.location?.href;
      if (!currentHref) return;

      const url = new URL(currentHref);
      url.searchParams.set("sortBy", apiSortKey);
      url.searchParams.set("sortDirection", newDirection);
      url.searchParams.set("page", "1"); // Reset to page 1 when sorting changes

      // Use Fresh.js navigation
      const link = document.createElement("a");
      link.href = url.toString();
      link.setAttribute("f-partial", "");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper function to get segmented control header class names (Apple HIG style)
  const getSegmentedHeaderClass = (
    index: number,
    isFirst: boolean,
    isLast: boolean,
    isSelected: boolean,
    isClickable: boolean,
  ) => {
    const baseClass = `${labelXs} ${cellAlign(index, headers.length)} py-2`;

    // Row background color and rounded corners
    const rowClass = isFirst
      ? "bg-stamp-grey-darkest/15 rounded-l-lg"
      : isLast
      ? "bg-stamp-grey-darkest/15 rounded-r-lg"
      : "bg-stamp-grey-darkest/15";

    // Selected segment styling
    const selectedClass = isSelected ? "text-stamp-grey-light" : "";

    const colorClass = isSelected
      ? "text-stamp-grey-light"
      : isClickable
      ? "text-stamp-grey-darker hover:text-stamp-grey-light"
      : "text-stamp-grey-darker";

    const clickableClass = isClickable
      ? "cursor-pointer transition-all duration-200 select-none"
      : "";

    const sortIndicator = isSelected ? "relative" : "";

    return `${baseClass} ${rowClass} ${selectedClass} ${colorClass} ${clickableClass} ${sortIndicator}`
      .trim();
  };

  // Helper function to render sort indicator
  const renderSortIndicator = (headerName: string) => {
    // Map header names to API sort parameters
    const sortMapping: Record<string, string> = {
      "TOKEN": "TOKEN",
      "MINTS": "MINTS",
      "PROGRESS": "PROGRESS",
      "DEPLOY": "DEPLOY",
      "HOLDERS": "HOLDERS",
    };

    const apiSortKey = sortMapping[headerName];
    const isCurrentSort = currentSort?.filter === apiSortKey;

    if (!isCurrentSort) return null;

    return (
      <span class="absolute -right-5 -top-[1px]">
        <Icon
          type="icon"
          name="caretUp"
          weight="normal"
          size="xxxs"
          color="custom"
          className={` stroke-stamp-grey-light transition-all duration-300 transform ${
            currentSort.direction === "desc" ? "scale-y-[-1]" : ""
          }`}
        />
      </span>
    );
  };

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
    <div class="overflow-x-auto">
      <table class={`w-full ${textSm} border-separate border-spacing-y-3`}>
        <colgroup>
          {colGroup([
            {
              width:
                "min-w-[150px] max-w-[180px] w-auto sticky left-0 tablet:static",
            }, // TOKEN
            { width: "min-w-[100px] w-auto" }, // MINTS
            { width: "min-w-[120px] w-auto" }, // PROGRESS
            { width: "min-w-[110px] w-auto" }, // TRENDING
            { width: "min-w-[110px] w-auto" }, // DEPLOY
            { width: "min-w-[90px] w-auto" }, // HOLDERS
            { width: "min-w-[100px] w-auto" }, // MINT button
          ]).map((col) => <col key={col.key} class={col.className} />)}
        </colgroup>
        <thead>
          <tr>
            {headers.map((header, i) => {
              const isFirst = i === 0;
              const isLast = i === headers.length - 1;
              const isClickable = header !== "" && header !== "TRENDING";

              // Get sort state for segmented control styling
              const sortMapping: Record<string, string> = {
                "TOKEN": "TOKEN",
                "MINTS": "MINTS",
                "PROGRESS": "PROGRESS",
                "DEPLOY": "DEPLOY",
                "HOLDERS": "HOLDERS",
              };
              const apiSortKey = sortMapping[header];
              const isSelected = currentSort?.filter === apiSortKey;

              return (
                <th
                  key={header}
                  class={`${
                    getSegmentedHeaderClass(
                      i,
                      isFirst,
                      isLast,
                      isSelected,
                      isClickable,
                    )
                  } ${
                    isFirst
                      ? "sticky left-0 tablet:static backdrop-blur-sm tablet:backdrop-blur-none z-10"
                      : ""
                  }`}
                  onClick={() => handleHeaderClick(header)}
                >
                  <span class="relative inline-block">
                    {header}
                    {header === "TRENDING" && ` ${timeframe}`}
                    {renderSortIndicator(header)}
                  </span>
                </th>
              );
            })}
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
                  (src20.deploy_tx
                    ? constructStampUrl(src20.deploy_tx)
                    : null) ||
                  "/img/placeholder/stamp-no-image.svg";

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

                  globalThis.location.href = mintHref;
                };

                return (
                  <tr
                    key={src20.tx_hash}
                    class={`${containerCardTable} cursor-pointer group`}
                    onClick={(e) => {
                      // Only navigate if not clicking on image or button
                      const target = e.target as HTMLElement;
                      const isImage = target.tagName === "IMG";
                      const isButton = target.closest("button");
                      if (
                        !isImage && !isButton && !e.ctrlKey && !e.metaKey &&
                        e.button !== 1
                      ) {
                        e.preventDefault();
                        if (
                          typeof globalThis !== "undefined" &&
                          globalThis?.location
                        ) {
                          const href = `/src20/${
                            encodeURIComponent(unicodeEscapeToEmoji(src20.tick))
                          }`;
                          globalThis.location.href = href;
                        }
                      }
                    }}
                  >
                    {/* TOKEN */}
                    <td
                      class={`${
                        cellAlign(0, headers.length)
                      } ${rowCardBorderLeft} sticky left-0 tablet:static backdrop-blur-sm tablet:backdrop-blur-none z-10`}
                    >
                      <div class="flex items-center gap-4">
                        <img
                          src={imageUrl}
                          class="w-7 h-7 rounded cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Prevent row click
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
                                    <span class="gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] inline-block transition-colors duration-300">
                                      {text.toUpperCase()}
                                    </span>
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
                      } ${rowCardBorderCenter}`}
                    >
                      {src20.mint_progress?.total_mints || "N/A"}
                    </td>
                    {/* PROGRESS */}
                    <td
                      class={`${
                        cellAlign(2, headers.length)
                      } ${rowCardBorderCenter}`}
                    >
                      <div class="flex items-center justify-center w-full">
                        <div class="flex flex-col w-[100px] min-[420px]:w-[120px] mobileLg:w-[160px] gap-1">
                          <div class="!text-xs text-center">
                            {Number(
                              src20.mint_progress?.progress || src20.progress ||
                                0,
                            )}
                            <span class="text-stamp-grey-light">%</span>
                          </div>
                          <div class="relative h-1.5 bg-stamp-grey rounded-full">
                            <div
                              class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
                              style={{
                                width: `${
                                  src20.mint_progress?.progress ||
                                  src20.progress || 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* TRENDING */}
                    <td
                      class={`${
                        cellAlign(3, headers.length)
                      } ${rowCardBorderCenter}`}
                    >
                      {"N/A"}
                    </td>
                    {/* DEPLOY */}
                    <td
                      class={`${
                        cellAlign(4, headers.length)
                      } ${rowCardBorderCenter}`}
                    >
                      {formatDate(new Date(src20.block_time), {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      }).toUpperCase()}
                    </td>
                    {/* HOLDERS */}
                    <td
                      class={`${
                        cellAlign(5, headers.length)
                      } ${rowCardBorderCenter}`}
                    >
                      {Number(
                        (src20 as any)?.market_data?.holder_count ||
                          (src20 as any)?.holders || 0,
                      ).toLocaleString()}
                    </td>
                    {/* MINT BUTTON */}
                    <td
                      class={`text-right ${rowCardBorderRight}`}
                    >
                      <Button
                        variant="outline"
                        color="custom"
                        size="xxs"
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
    </div>
  );
}
