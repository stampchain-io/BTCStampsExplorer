// import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
} from "$layout";
import { labelXs, textSm, valueDark } from "$text";
import type { EnrichedSRC20Row } from "$globals";

interface SRC20CardSmProps {
  data: EnrichedSRC20Row[];
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  onImageClick: (imgSrc: string) => void;
}

export function SRC20CardSm({
  data,
  onImageClick,
}: SRC20CardSmProps) {
  const headers = [
    "TOKEN",
    "PRICE",
    "CHANGE 24H",
    "VOLUME 24H",
    "MARKETCAP",
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
              "w-[45%] min-[420px]:w-[35%] mobileMd:w-[20%] tablet:w-[30%] desktop:w-[20%]",
          }, // TOKEN
          {
            width:
              "w-[35%] min-[420px]:w-[40%] mobileMd:w-[20%] tablet:w-[25%] desktop:w-[20%]",
          }, // PRICE
          {
            width:
              "w-[20%] min-[420px]:w-[25%] mobileMd:w-[20%] tablet:w-[20%] desktop:w-[20%]",
          }, // CHANGE
          { width: "hidden mobileMd:w-[20%] tablet:w-[25%] desktop:w-[20%]" }, // VOLUME (24H)
          { width: "hidden mobileMd:w-[20%] tablet:hidden desktop:w-[20%]" }, // MARKETCAP
        ]).map((col) => <col key={col.key} className={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers.length)}
              ${
                header === "MARKETCAP"
                  ? "hidden mobileMd:table-cell tablet:hidden desktop:table-cell"
                  : header === "VOLUME 24H"
                  ? "hidden mobileMd:table-cell mobileMd:text-center tablet:text-right desktop:text-center"
                  : header === "CHANGE 24H"
                  ? "text-right mobileMd:text-center"
                  : ""
              }
              `}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length
          ? (
            data.map((src20, index) => {
              const imageUrl = src20.stamp_url ||
                src20.deploy_img ||
                `/content/${src20.tx_hash}.svg` ||
                `/content/${src20.deploy_tx}`;

              // --- BEGIN DEBUG LOGS ---
              if (index < 3) { // Log only for the first 3 items to avoid spam
                console.log(
                  `[SRC20CardSm] Debugging item ${index}, Tick: ${src20.tick}`,
                );
                console.log(
                  `  Raw src20.market_data:`,
                  JSON.stringify(src20.market_data),
                );
                const priceBTC = src20.market_data?.floor_unit_price;
                console.log(
                  `  src20.market_data?.floor_unit_price (BTC):`,
                  priceBTC,
                );
                const priceSATSBeforeRound = (priceBTC ?? 0) * 1e8;
                console.log(
                  `  Price in SATS (before round):`,
                  priceSATSBeforeRound,
                );
                const priceSATSAfterRound = Math.round(priceSATSBeforeRound);
                console.log(
                  `  Price in SATS (after round):`,
                  priceSATSAfterRound,
                );
              }
              // --- END DEBUG LOGS ---

              return (
                <tr
                  key={src20.tx_hash}
                  class={`${containerCardTable} cursor-pointer group`}
                  onClick={(e) => {
                    // Only navigate if not clicking on image or chart
                    const target = e.target as HTMLElement;
                    const isImage = target.tagName === "IMG";
                    const isChart = target.closest("[data-chart-widget]"); // Add this data attribute to ChartWidget
                    if (
                      !isImage && !isChart && !e.ctrlKey && !e.metaKey &&
                      e.button !== 1
                    ) {
                      e.preventDefault();
                      const href = `/src20/${
                        encodeURIComponent(unicodeEscapeToEmoji(src20.tick))
                      }`;
                      globalThis.location.href = href;
                    }
                  }}
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
                        class="w-7 h-7 rounded-sm cursor-pointer"
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
                  {/* PRICE */}
                  <td
                    class={`${
                      cellAlign(1, headers.length)
                    } ${rowCardBorderCenter}`}
                  >
                    {(() => {
                      const priceInBtc = src20.market_data?.floor_unit_price ??
                        0;
                      if (priceInBtc === 0) {
                        return "0 SATS";
                      }
                      const priceInSatsExact = priceInBtc * 1e8;
                      const priceInSatsRounded = Math.round(priceInSatsExact);
                      if (priceInSatsRounded === 0) {
                        return "< 1 SATS";
                      }
                      return priceInSatsRounded.toLocaleString() + " SATS";
                    })()}
                  </td>
                  {/* CHANGE 24H */}
                  <td
                    class={`text-right mobileMd:text-center 
                      ${rowCardBorderRight} 
                      mobileMd:${rowCardBorderCenter} mobileMd:pr-3 mobileMd:border-r-0 mobileMd:rounded-r-none`}
                  >
                    {src20.market_data?.change24 !== undefined &&
                        src20.market_data?.change24 !== null
                      ? (
                        <span
                          class={src20.market_data.change24 >= 0
                            ? "text-green-500"
                            : "text-red-500"}
                        >
                          {src20.market_data.change24.toFixed(2)}%
                        </span>
                      )
                      : <span class="text-stamp-grey-light">N/A%</span>}
                  </td>
                  {/* VOLUME 24H */}
                  <td
                    class={`mobileMd:text-center tablet:text-right desktop:text-center
                    ${rowCardBorderCenter}
                     hidden mobileMd:table-cell mobileMd:pr-3 mobileMd:border-r-0 mobileMd:rounded-r-none
                     tablet:${rowCardBorderRight} tablet:pr-4 tablet:rounded-r-lg tablet:border-r-2
                     desktop:${rowCardBorderCenter} desktop:pr-3 desktop:border-r-0 desktop:rounded-r-none`}
                  >
                    {src20.market_data?.volume24 !== undefined &&
                        src20.market_data?.volume24 !== null
                      ? src20.market_data.volume24.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>
                  {/* MARKETCAP */}
                  <td
                    class={`
                      ${cellAlign(4, headers.length)}
                      ${rowCardBorderRight}
                      hidden mobileMd:table-cell tablet:hidden desktop:table-cell
                    `}
                  >
                    {src20.market_data?.mcap !== undefined &&
                        src20.market_data?.mcap !== null
                      ? src20.market_data.mcap.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>
                </tr>
              );
            })
          )
          : (
            <tr>
              <td colSpan={headers.length} class={`${valueDark} w-full`}>
                NO TOKENS TO DISPLAY
              </td>
            </tr>
          )}
      </tbody>
    </table>
  );
}
