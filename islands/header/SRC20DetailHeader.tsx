/* ===== SRC20 DETAIL HEADER COMPONENT ===== */
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { Deployment, MintStatus } from "$types/index.d.ts";
import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/formatUtils.ts";
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { labelSm, titleGreyLD, valueSm } from "$text";
import type { AlignmentType } from "$layout";
import { StatItem, StatTitle } from "$components/section/WalletComponents.tsx";
import type { MarketListingAggregated } from "$globals";

/* ===== TYPES ===== */
export interface SRC20DetailHeaderProps {
  deployment: Deployment & {
    email?: string;
    web?: string;
    tg?: string;
    x?: string;
  };
  _mintStatus: MintStatus;
  _totalMints: number;
  _totalTransfers: number;
  marketInfo?: MarketListingAggregated;
  _align?: AlignmentType;
}

/* ===== COMPONENT ===== */
export function SRC20DetailHeader({
  deployment,
  marketInfo,
}: SRC20DetailHeaderProps) {
  /* ===== COMPUTED VALUES ===== */
  // Process tick value (handle emoji)
  const tickValue = deployment.tick
    ? (() => {
      console.log("Original tick:", deployment.tick);
      const converted = unicodeEscapeToEmoji(deployment.tick);
      console.log("Converted tick:", converted);
      return converted;
    })()
    : "N/A";

  // Format deployment date
  const deployDate = formatDate(new Date(deployment.block_time), {
    month: "short",
    year: "numeric",
  });

  // Market data formatting
  const floorUnitPriceBTC = marketInfo?.floor_unit_price ?? 0;
  const sum1dBTC = marketInfo?.volume24 ?? 0;
  const mcapBTC = marketInfo?.mcap ?? 0;

  // Convert floorUnitPrice from BTC to Satoshis
  const floorUnitPriceSats = Math.round(floorUnitPriceBTC * 1e8);

  // Format BTC values to 8 decimal places
  const sum1dBTCFormatted = formatNumber(sum1dBTC, 4);
  const sum7dBTCFormatted = formatNumber(sum1dBTC * 7, 4);
  const mcapBTCFormatted = formatNumber(mcapBTC, 4);

  // Format Satoshi value with commas (no decimals needed)
  const floorUnitPriceSatsFormatted = floorUnitPriceSats.toLocaleString();

  /* ===== RENDER ===== */
  return (
    <>
      <SearchSRC20Modal showButton={false} />
      <div class="flex w-full flex-col gap-6">
        {/* ===== TOKEN INFO CARD ===== */}
        <div class="relative w-full flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient rounded-lg">
          <div class="flex flex-row w-full">
            {/* ===== TOKEN IMAGE AND CREATOR ===== */}
            <div className="flex gap-[18px] mobileMd:gap-[30px]">
              <img
                src={`/content/${deployment.tx_hash}.svg`}
                class="max-w-[80px] rounded-sm relative z-10"
                alt={`${deployment.tick} token image`}
                loading="lazy"
              />
              <div class="relative z-10">
                {/* Token name and social links */}
                <div class="flex">
                  <h1 class={`${titleGreyLD} uppercase`}>
                    {tickValue}
                  </h1>
                  <div class="flex gap-3 items-center">
                    {deployment.email && (
                      <a href={deployment.email} target="_blank">
                        <img src="/img/src20/details/EnvelopeSimple.svg" />
                      </a>
                    )}
                    {deployment.web && (
                      <a href={deployment.web} target="_blank">
                        <img src="/img/src20/details/Globe.svg" />
                      </a>
                    )}
                    {deployment.tg && (
                      <a href={deployment.tg} target="_blank">
                        <img src="/img/src20/details/TelegramLogo.svg" />
                      </a>
                    )}
                    {deployment.x && (
                      <a href={deployment.x} target="_blank">
                        <img src="/img/src20/details/XLogo.svg" />
                      </a>
                    )}
                  </div>
                </div>
                {/* Creator information */}
                <h6 className={labelSm}>
                  CREATOR
                </h6>
                <h5 className="font-bold text-lg gray-gradient3-hover tracking-wide -mt-1">
                  {deployment.creator_name ||
                    abbreviateAddress(deployment.destination)}
                </h5>
              </div>
            </div>

            {/* ===== DEPLOYMENT DETAILS ===== */}
            <div class="flex flex-col gap-0 justify-end ml-auto">
              <div class="hidden mobileLg:flex flex-col ml-20 mb-0 -space-y-0.5 items-center">
                <div class="flex items-center gap-1.5">
                  <h5 className={labelSm}>
                    DEPLOY
                  </h5>
                  <h6 className={valueSm}>
                    {deployDate.toUpperCase()}
                  </h6>
                </div>
                <div class="flex items-center gap-1.5">
                  <h5 className={labelSm}>
                    BLOCK #
                  </h5>
                  <h6 className={valueSm}>
                    {deployment.block_index}
                  </h6>
                </div>
                <div class="flex items-center gap-1.5">
                  <h5 className={labelSm}>
                    TX ID
                  </h5>
                  <h6 className={valueSm}>
                    {abbreviateAddress(deployment.tx_hash)}
                  </h6>
                </div>
              </div>
            </div>

            {/* ===== TOKEN PARAMETERS ===== */}
            <div class="flex flex-col gap-0 justify-end items-end ml-auto">
              <div class="flex flex-col -space-y-0.5 text-right">
                <div class="flex items-center gap-1.5 justify-end">
                  <h5 className={labelSm}>
                    DECIMALS
                  </h5>
                  <h6 className={valueSm}>
                    {deployment.deci}
                  </h6>
                </div>
                <div class="flex items-center gap-1.5 justify-end">
                  <h5 className={labelSm}>
                    LIMIT
                  </h5>
                  <h6 className={valueSm}>
                    {formatNumber(deployment.lim, 0)}
                  </h6>
                </div>
                <div class="flex items-center gap-1.5 justify-end">
                  <h5 className={labelSm}>
                    SUPPLY
                  </h5>
                  <h6 className={valueSm}>
                    {formatNumber(deployment.max, 0)}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MARKET INFORMATION CARD ===== */}
        <div class="flex flex-col dark-gradient rounded-lg p-6">
          {/* Market cap */}
          <div className="flex flex-col">
            <StatTitle
              label="MARKET CAP"
              value={`${mcapBTCFormatted} BTC`}
            />
          </div>

          {/* ===== VOLUME STATS ===== */}
          <div class="flex flex-wrap justify-between pt-6">
            <StatItem
              label="24H VOLUME"
              value={`${sum1dBTCFormatted} BTC`}
              align="left"
            />
            <StatItem
              label="3 DAY VOLUME"
              value="N/A BTC"
              align="center"
            />
            <StatItem
              label="7 DAY VOLUME"
              value={`${sum7dBTCFormatted} BTC`}
              align="right"
            />
          </div>

          {/* ===== PRICE STATS ===== */}
          <div class="flex flex-wrap justify-between pt-3">
            <StatItem
              label="PRICE"
              value={`${floorUnitPriceSatsFormatted} SATS`}
            />
            <StatItem
              label="24H CHANGE"
              value="N/A %"
              align="center"
            />
            <StatItem
              label="7 DAY CHANGE"
              value="N/A %"
              align="right"
            />
          </div>
        </div>
      </div>
    </>
  );
}
