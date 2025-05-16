// import { SRC20Row } from "$globals";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { Timeframe } from "$layout";
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
  timeframe: Timeframe;
  onImageClick: (imgSrc: string) => void;
}

export function SRC20CardSm({
  data,
  timeframe,
  onImageClick,
}: SRC20CardSmProps) {
  const headers = [
    "TOKEN",
    "PRICE",
    "MCAP",
    "VOLUME (24H)",
    "CHANGE",
    "", // CHART
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
    <table class={`w-full ${textSm} border-separate border-spacing-y-3`}>
      <colgroup>
        {colGroup([
          { width: "w-[20%]" }, // TOKEN
          { width: "w-[15%]" }, // PRICE
          { width: "w-[15%]" }, // MCAP
          { width: "w-[15%]" }, // VOLUME (24H)
          { width: "w-[15%]" }, // CHANGE
          { width: "w-[20%]" }, // CHART
        ]).map((col) => <col key={col.key} className={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers.length)}
              ${
                (header === "CHANGE" || header === "MCAP" ||
                    header === "VOLUME (24H)")
                  ? "hidden mobileMd:table-cell"
                  : ""
              }
              `}
            >
              {header}
              {header === "CHANGE" && ` ${timeframe}`}
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
                  {/* MCAP */}
                  <td
                    class={`${
                      cellAlign(2, headers.length)
                    } ${rowCardBorderCenter} hidden mobileMd:table-cell`}
                  >
                    {src20.market_data?.mcap !== undefined &&
                        src20.market_data?.mcap !== null
                      ? src20.market_data.mcap.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>
                  {/* VOLUME (24H) */}
                  <td
                    class={`${
                      cellAlign(3, headers.length)
                    } ${rowCardBorderCenter} hidden mobileMd:table-cell`}
                  >
                    {src20.market_data?.volume24 !== undefined &&
                        src20.market_data?.volume24 !== null
                      ? src20.market_data.volume24.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 8,
                      }) + " BTC"
                      : "N/A"}
                  </td>
                  {/* CHANGE */}
                  <td
                    class={`${
                      cellAlign(4, headers.length)
                    } ${rowCardBorderCenter} hidden mobileMd:table-cell`}
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
                  {/* CHART */}
                  <td
                    class={`${
                      cellAlign(5, headers.length)
                    } ${rowCardBorderRight}`}
                  >
                    <ChartWidget
                      fromPage="home"
                      data={src20.chart}
                      tick={src20.tick}
                      data-chart-widget
                    />
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
