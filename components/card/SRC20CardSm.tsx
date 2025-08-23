// import { SRC20Row } from "$globals";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { EnrichedSRC20Row } from "$types/src20.d.ts";
import {
  containerCardTable,
  rowCardBorderCenter,
  rowCardBorderLeft,
  rowCardBorderRight,
} from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import { getSRC20ImageSrc } from "$lib/utils/ui/media/imageUtils.ts";
import { safeNavigate } from "$lib/utils/navigation/freshNavigationUtils.ts";
import { labelXs, textSm, valueDarkSm } from "$text";

interface SRC20CardSmProps {
  data: EnrichedSRC20Row[];
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  onImageClick: (imgSrc: string) => void;
}

export function SRC20CardSm({
  data,
  fromPage,
  onImageClick,
}: SRC20CardSmProps) {
  const headers = fromPage === "wallet"
    ? [
      "TOKEN",
      "BALANCE",
      "PRICE",
      "CHANGE 24H",
      "VOLUME 24H",
      "MARKETCAP",
    ]
    : [
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
        {colGroup(
          fromPage === "wallet"
            ? [
              {
                width:
                  "w-[30%] min-[420px]:w-[25%] mobileMd:w-[15%] tablet:w-[20%] desktop:w-[15%]",
              }, // TOKEN
              {
                width:
                  "w-[25%] min-[420px]:w-[25%] mobileMd:w-[15%] tablet:w-[15%] desktop:w-[15%]",
              }, // BALANCE
              {
                width:
                  "w-[25%] min-[420px]:w-[25%] mobileMd:w-[15%] tablet:w-[20%] desktop:w-[15%]",
              }, // PRICE
              {
                width:
                  "w-[20%] min-[420px]:w-[25%] mobileMd:w-[15%] tablet:w-[15%] desktop:w-[15%]",
              }, // CHANGE
              {
                width: "hidden mobileMd:w-[20%] tablet:w-[20%] desktop:w-[20%]",
              }, // VOLUME (24H)
              {
                width: "hidden mobileMd:w-[20%] tablet:hidden desktop:w-[20%]",
              }, // MARKETCAP
            ]
            : [
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
              {
                width: "hidden mobileMd:w-[20%] tablet:w-[25%] desktop:w-[20%]",
              }, // VOLUME (24H)
              {
                width: "hidden mobileMd:w-[20%] tablet:hidden desktop:w-[20%]",
              }, // MARKETCAP
            ],
        ).map((col) => <col key={col.key} class={col.className} />)}
      </colgroup>
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={header}
              class={`${labelXs} ${cellAlign(i, headers?.length ?? 0)}
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
        {data?.length
          ? (
            data.map((src20: EnrichedSRC20Row) => {
              // Use centralized image URL logic
              const imageUrl = getSRC20ImageSrc(src20);

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
                        encodeURIComponent(
                          unicodeEscapeToEmoji(src20.tick ?? ""),
                        )
                      }`;
                      safeNavigate(href);
                    }
                  }}
                >
                  {/* TOKEN */}
                  <td
                    class={`${
                      cellAlign(0, headers?.length ?? 0)
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
                        alt={unicodeEscapeToEmoji(src20.tick ?? "")}
                      />
                      <div class="flex flex-col">
                        <div class="font-bold text-base uppercase tracking-wide">
                          {(() => {
                            const { text, emoji } = splitTextAndEmojis(
                              unicodeEscapeToEmoji(src20.tick ?? ""),
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
                  {/* BALANCE - only show in wallet view */}
                  {fromPage === "wallet" && (
                    <td
                      class={`${
                        cellAlign(1, headers?.length ?? 0)
                      } ${rowCardBorderCenter}`}
                    >
                      {(() => {
                        const balance = Number(src20.amt || 0);
                        if (balance === 0) return "0";
                        // Format with commas for large numbers
                        return balance.toLocaleString();
                      })()}
                    </td>
                  )}
                  {/* PRICE */}
                  <td
                    class={`${
                      cellAlign(
                        fromPage === "wallet" ? 2 : 1,
                        headers?.length ?? 0,
                      )
                    } ${rowCardBorderCenter}`}
                  >
                    {(() => {
                      // ✅ FIXED: Use price_btc for fungible tokens with proper type conversion
                      const priceInBtcRaw = src20.market_data?.price_btc ?? 0;

                      // Convert to number and validate
                      const priceInBtc = Number(priceInBtcRaw);
                      if (isNaN(priceInBtc) || priceInBtc === 0) {
                        return "0 SATS";
                      }
                      const priceInSats = priceInBtc * 1e8;

                      // Smart formatting based on price level
                      if (priceInSats < 0.0001) {
                        // For extremely small values, show with high precision
                        return priceInSats.toFixed(6) + " SATS";
                      } else if (priceInSats < 1) {
                        // For values less than 1 sat, show 4 decimal places
                        return priceInSats.toFixed(4) + " SATS";
                      } else if (priceInSats < 10) {
                        // For values 1-10 sats, show 2 decimal places
                        return priceInSats.toFixed(2) + " SATS";
                      } else if (priceInSats < 100) {
                        // For values 10-100 sats, show 1 decimal place
                        return priceInSats.toFixed(1) + " SATS";
                      } else if (priceInSats < 1000) {
                        // For values 100-1000 sats, show whole numbers
                        return Math.round(priceInSats).toLocaleString() +
                          " SATS";
                      } else {
                        // For values above 1000 sats, use comma formatting
                        return Math.round(priceInSats).toLocaleString() +
                          " SATS";
                      }
                    })()}
                  </td>
                  {/* CHANGE 24H */}
                  <td
                    class={`text-right mobileMd:text-center
                      ${rowCardBorderRight}
                      mobileMd:${rowCardBorderCenter} mobileMd:pr-3 mobileMd:border-r-0 mobileMd:rounded-r-none`}
                  >
                    {/* ✅ FIXED: Use change_24h_percent (correct field name) */}
                    {(() => {
                      const changePercent =
                        src20.market_data?.change_24h_percent ?? 0;

                      // Convert to number and validate
                      const changeValue = Number(changePercent);
                      if (isNaN(changeValue)) {
                        return (
                          <span class="text-stamp-grey-light">+0.00%</span>
                        );
                      }

                      return (
                        <span
                          class={changeValue >= 0
                            ? "text-success font-mono text-xs"
                            : "text-danger font-mono text-xs"}
                        >
                          {changeValue >= 0 ? "+" : ""}
                          {changeValue.toFixed(2)}%
                        </span>
                      );
                    })()}
                  </td>
                  {/* VOLUME 24H */}
                  <td
                    class={`mobileMd:text-center tablet:text-right desktop:text-center
                    ${rowCardBorderCenter}
                     hidden mobileMd:table-cell mobileMd:pr-3 mobileMd:border-r-0 mobileMd:rounded-r-none
                     tablet:${rowCardBorderRight} tablet:pr-4 tablet:rounded-r-lg tablet:border-r-2
                     desktop:${rowCardBorderCenter} desktop:pr-3 desktop:border-r-0 desktop:rounded-r-none`}
                  >
                    {(() => {
                      // ✅ FIXED: Use v2.3 standardized field name with proper type conversion
                      const volumeRaw = src20.market_data?.volume_24h_btc ?? 0;

                      // Convert to number and validate
                      const volume = Number(volumeRaw);
                      if (isNaN(volume)) {
                        return "N/A";
                      }

                      // Smart formatting based on volume level
                      if (volume === 0) {
                        return "0 BTC";
                      } else if (volume < 0.0001) {
                        // For very small volumes, show 6 decimals
                        return volume.toFixed(6) + " BTC";
                      } else if (volume < 0.01) {
                        // For small volumes, show 4 decimals
                        return volume.toFixed(4) + " BTC";
                      } else if (volume < 0.1) {
                        // For medium-small volumes, show 3 decimals
                        return volume.toFixed(3) + " BTC";
                      } else if (volume < 1) {
                        // For sub-1 BTC volumes, show 2 decimals
                        return volume.toFixed(2) + " BTC";
                      } else if (volume < 100) {
                        // For 1-100 BTC, show 2 decimals
                        return volume.toFixed(2) + " BTC";
                      } else {
                        // For large volumes, show whole numbers with commas
                        return Math.round(volume).toLocaleString() + " BTC";
                      }
                    })()}
                  </td>
                  {/* MARKETCAP */}
                  <td
                    class={`
                      ${
                      cellAlign(
                        fromPage === "wallet" ? 5 : 4,
                        headers?.length ?? 0,
                      )
                    }
                      ${rowCardBorderRight}
                      hidden mobileMd:table-cell tablet:hidden desktop:table-cell
                    `}
                  >
                    {(() => {
                      // ✅ FIXED: Use v2.3 standardized field name with proper type conversion
                      const marketCapRaw = src20.market_data?.market_cap_btc ??
                        0;

                      // Convert to number and validate
                      const marketCap = Number(marketCapRaw);
                      if (isNaN(marketCap)) {
                        return "N/A";
                      }

                      // Smart formatting for market cap
                      if (marketCap === 0) {
                        return "0 BTC";
                      } else if (marketCap < 1) {
                        // For small market caps, show 2 decimals
                        return marketCap.toFixed(2) + " BTC";
                      } else if (marketCap < 100) {
                        // For medium market caps, show 2 decimals
                        return marketCap.toFixed(2) + " BTC";
                      } else if (marketCap < 1000) {
                        // For larger market caps, show 1 decimal
                        return marketCap.toFixed(1) + " BTC";
                      } else {
                        // For very large market caps, show whole numbers with commas
                        return Math.round(marketCap).toLocaleString() + " BTC";
                      }
                    })()}
                  </td>
                </tr>
              );
            })
          )
          : (
            <tr>
              <td
                colSpan={headers?.length ?? 0}
                class={`${valueDarkSm} w-full`}
              >
                NO TOKENS TO DISPLAY
              </td>
            </tr>
          )}
      </tbody>
    </table>
  );
}
