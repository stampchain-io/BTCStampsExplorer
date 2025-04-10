/* ===== SRC20 DETAIL HEADER COMPONENT ===== */
import { useState } from "preact/hooks";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import {
  Deployment,
  MarketListingSummary,
  MintStatus,
} from "$types/index.d.ts";
import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/formatUtils.ts";
import { SRC20SearchClient } from "$search";

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
  marketInfo?: MarketListingSummary;
  _align?: "left" | "center" | "right";
}

/* ===== STAT ITEM COMPONENT ===== */
function StatItem(
  { label, value, direction, currency, align = "left", large = false }: {
    label: string;
    value: string | number;
    currency?: string;
    direction: string;
    align?: "left" | "center" | "right";
    large?: boolean;
  },
) {
  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  /* ===== RENDER STAT ITEM ===== */
  return (
    <div
      class={`flex ${
        direction === "col"
          ? "flex-col -space-y-1"
          : "gap-1.5 items-center justify-end"
      } ${alignmentClass}`}
    >
      <p
        class={`${
          large ? "text-base mobileLg:text-lg" : "text-sm mobileLg:text-base"
        } font-light text-stamp-grey-darker uppercase`}
      >
        {label}
      </p>
      <p
        class={`${
          large
            ? "text-3xl mobileLg:text-4xl font-black -mt-0.5"
            : "text-sm mobileLg:text-base"
        } ${
          direction === "col"
            ? "text-stamp-grey-light"
            : "text-stamp-grey-light"
        }`}
      >
        {value}
        {currency
          ? (
            <span class="font-light">
              &nbsp;{currency}
            </span>
          )
          : ""}
      </p>
    </div>
  );
}

/* ===== COMPONENT ===== */
export function SRC20DetailHeader({
  deployment,
  _mintStatus,
  _totalMints,
  _totalTransfers,
  marketInfo,
  _align,
}: SRC20DetailHeaderProps) {
  /* ===== STATE ===== */
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  const sum1dBTC = marketInfo?.sum_1d ?? 0;
  const mcapBTC = marketInfo?.mcap ?? 0;

  // Convert floorUnitPrice from BTC to Satoshis
  const floorUnitPriceSats = Math.round(floorUnitPriceBTC * 1e8);

  // Format BTC values to 8 decimal places
  const sum1dBTCFormatted = formatNumber(sum1dBTC, 4);
  const sum7dBTCFormatted = formatNumber(sum1dBTC * 7, 4);
  const mcapBTCFormatted = formatNumber(mcapBTC, 4);

  // Format Satoshi value with commas (no decimals needed)
  const floorUnitPriceSatsFormatted = floorUnitPriceSats.toLocaleString();

  /* ===== STYLING ===== */
  const titleGreyLDClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient1";

  /* ===== RENDER ===== */
  return (
    <>
      <SRC20SearchClient
        open2={isSearchOpen}
        handleOpen2={setIsSearchOpen}
        showButton={false}
      />

      <div class="flex w-full flex-col gap-6">
        {/* ===== TOKEN INFO CARD ===== */}
        <div class="relative w-full flex flex-wrap gap-3 mobileMd:gap-6 p-3 mobileMd:p-6 dark-gradient rounded-lg">
          <div class="flex flex-row w-full">
            {/* ===== TOKEN IMAGE AND CREATOR ===== */}
            <div className="flex gap-[18px] mobileMd:gap-[30px]">
              <img
                src={`/content/${deployment.tx_hash}.svg`}
                class="max-w-[83px] mobileMd:max-w-[91px] mobileLg:max-w-[103px] rounded relative z-10"
                alt={`${deployment.tick} token image`}
                loading="lazy"
              />
              <div class="relative z-10">
                {/* Token name and social links */}
                <div class="flex">
                  <p class={titleGreyLDClassName + " uppercase"}>
                    {tickValue}
                  </p>
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
                <p class="text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase pt-1.5">
                  CREATOR
                </p>
                <p className="text-xl mobileLg:text-2xl font-black gray-gradient3 -mt-1">
                  {deployment.creator_name ||
                    abbreviateAddress(deployment.destination)}
                </p>
              </div>
            </div>

            {/* ===== DEPLOYMENT DETAILS ===== */}
            <div class="flex flex-col gap-0 justify-end ml-auto">
              <div class="hidden mobileLg:flex flex-col ml-20 mb-0 -space-y-0.5 items-center">
                <StatItem
                  label="DEPLOY"
                  value={deployDate.toUpperCase()}
                  direction="row"
                  align="center"
                />
                <StatItem
                  label="BLOCK #"
                  value={deployment.block_index}
                  direction="row"
                  align="center"
                />
                <StatItem
                  label="TX ID"
                  value={abbreviateAddress(deployment.tx_hash)}
                  direction="row"
                  align="center"
                />
              </div>
            </div>

            {/* ===== TOKEN PARAMETERS ===== */}
            <div class="flex flex-col gap-0 justify-end items-end ml-auto">
              <div class="flex flex-col -space-y-0.5 text-right">
                <StatItem
                  label="DECIMALS"
                  value={deployment.deci}
                  direction="row"
                />
                <StatItem
                  label="LIMIT"
                  value={formatNumber(deployment.lim, 0)}
                  direction="row"
                />
                <div class="hidden">
                  <StatItem
                    label="SUPPLY"
                    value={formatNumber(deployment.max, 0)}
                    direction="col"
                    align="right"
                    large
                  />
                </div>
                <div>
                  <StatItem
                    label="SUPPLY"
                    value={formatNumber(deployment.max, 0)}
                    direction="row"
                    align="right"
                  />
                </div>
              </div>
            </div>
          </div>
          {
            /*
          <p class="text-sm text-[#CCCCCC] font-medium">
            This is an SRC-20 token, there are many like it, but this one is{" "}
            {deployment.tick.toUpperCase()}. This was deployed on block{" "}
            {deployment.block_index}{" "}
            without a description on the deploy. We hope you enjoy.
          </p>
          */
          }
        </div>

        {/* ===== MARKET INFORMATION CARD ===== */}
        <div class="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6">
          {/* Market cap */}
          <div className="flex flex-col">
            <StatItem
              label="MARKET CAP"
              value={mcapBTCFormatted}
              currency="BTC"
              direction="col"
              large
            />
          </div>

          {/* ===== VOLUME STATS ===== */}
          <div class="flex flex-wrap justify-between pt-3 mobileLg:pt-6">
            <StatItem
              label="24H VOLUME"
              value={sum1dBTCFormatted}
              currency="BTC"
              direction="col"
              align="left"
            />
            <StatItem
              label="3 DAY VOLUME"
              value="N/A" // FIXME: not available from API request
              currency="BTC"
              direction="col"
              align="center"
            />
            <StatItem
              label="7 DAY VOLUME"
              value={sum7dBTCFormatted}
              currency="BTC"
              direction="col"
              align="right"
            />
          </div>

          {/* ===== PRICE STATS ===== */}
          <div class="flex flex-wrap justify-between pt-1.5 mobileLg:pt-3">
            <StatItem
              label="PRICE"
              value={floorUnitPriceSatsFormatted}
              currency="SATS"
              direction="col"
            />
            <StatItem
              label="24H CHANGE"
              value="N/A" // FIXME: not available from API request
              currency="%"
              direction="col"
              align="center"
            />
            <StatItem
              label="7 DAY CHANGE"
              value="N/A" // FIXME: not available from API request
              currency="%"
              direction="col"
              align="right"
            />
          </div>
        </div>
      </div>
    </>
  );
}
