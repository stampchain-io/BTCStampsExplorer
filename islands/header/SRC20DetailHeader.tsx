/* ===== SRC20 DETAIL HEADER COMPONENT ===== */
import { Icon, PlaceholderImage } from "$icon";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import {
  body,
  containerBackground,
  containerGap,
  containerPill,
  StatItem,
} from "$layout";
import { unicodeEscapeToEmoji } from "$lib/utils/ui/formatting/emojiUtils.ts";
import {
  abbreviateAddress,
  formatDate,
  formatNumber,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { constructStampUrl } from "$lib/utils/ui/media/imageUtils.ts";
import {
  cardFileType,
  cardPrice,
  labelSm,
  titlePrimary,
  valueNegative,
  valueNeutral,
  valuePositive,
  valueSm,
} from "$text";
import type {
  SRC20DetailHeaderProps,
  SRC20DetailInfoProps,
} from "$types/ui.d.ts";
import { useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export function SRC20DetailHeader({
  deployment,
  marketInfo,
  highcharts,
}: SRC20DetailHeaderProps) {
  /* ===== STATE ===== */
  const [imgError, setImgError] = useState(false);

  /* ===== COMPUTED VALUES ===== */
  // Process tick value (handle emoji)
  const tickValue = deployment.tick
    ? unicodeEscapeToEmoji(deployment.tick)
    : "N/A";

  // ✅ ENHANCED IMAGE URL LOGIC: Use new stamp_url and deploy_img fields
  // 1. Use deploy_img if provided (for deploy operations: https://stampchain.io/stamps/{deploy_tx}.svg)
  // 2. Use stamp_url if provided (for transaction stamps: https://stampchain.io/stamps/{tx_hash}.svg)
  // 3. Fallback to constructing URL from deployment.tx_hash if available
  // 4. If unavailable (or fails to load), fall back to the placeholder icon
  const imageUrl = imgError ? null : deployment.deploy_img ||
    deployment.stamp_url ||
    (deployment.tx_hash ? constructStampUrl(deployment.tx_hash) : null);

  const floorPriceBTC = marketInfo?.floor_price_btc ?? 0; // ✅ v2.3 standardized field
  const volume24hBTC = marketInfo?.volume_24h_btc ?? 0; // ✅ v2.3 standardized field
  const marketCapBTC = marketInfo?.market_cap_btc ?? 0; // ✅ v2.3 standardized field
  const change24h = marketInfo?.change_24h ?? null; // ✅ v2.3 standardized field

  // Convert floorPrice from BTC to Satoshis with smart formatting
  const floorPriceSats = floorPriceBTC * 1e8;

  // Smart price formatting
  const formatPrice = (sats: number): string => {
    if (sats === 0) return "0 SATS";
    if (sats < 0.0001) return sats.toFixed(6) + " SATS";
    if (sats < 1) return sats.toFixed(4) + " SATS";
    if (sats < 10) return sats.toFixed(2) + " SATS";
    if (sats < 100) return sats.toFixed(1) + " SATS";
    if (sats < 1000) return Math.round(sats).toLocaleString() + " SATS";
    return Math.round(sats).toLocaleString() + " SATS";
  };

  // Smart BTC volume formatting
  const formatBTCVolume = (btc: number): string => {
    if (btc === 0) return "0 BTC";
    if (btc < 0.0001) return btc.toFixed(6) + " BTC";
    if (btc < 0.01) return btc.toFixed(4) + " BTC";
    if (btc < 0.1) return btc.toFixed(3) + " BTC";
    if (btc < 1) return btc.toFixed(2) + " BTC";
    if (btc < 100) return btc.toFixed(2) + " BTC";
    return Math.round(btc).toLocaleString() + " BTC";
  };

  // Smart market cap formatting
  const formatMarketCap = (btc: number): string => {
    if (btc === 0) return "0 BTC";
    if (btc < 1) return btc.toFixed(2) + " BTC";
    if (btc < 100) return btc.toFixed(2) + " BTC";
    if (btc < 1000) return btc.toFixed(1) + " BTC";
    return Math.round(btc).toLocaleString() + " BTC";
  };

  const floorPriceSatsFormatted = formatPrice(floorPriceSats);
  const volume24hBTCFormatted = formatBTCVolume(volume24hBTC);
  const marketCapBTCFormatted = formatMarketCap(marketCapBTC);

  /* ===== RENDER ===== */
  return (
    <>
      <div class={`${body} ${containerGap}`}>
        {/* ===== TOKEN INFO CARD ===== */}
        <div class={`relative ${containerBackground} flex-wrap`}>
          <div class="flex flex-row w-full items-center justify-between">
            {/* ===== TOKEN IMAGE AND NAME ===== */}
            <div class="flex gap-5">
              <div class="w-9 h-9 shrink-0 rounded-2xl overflow-hidden">
                {imageUrl
                  ? (
                    <img
                      src={imageUrl}
                      class="w-full h-full object-contain rounded-2xl"
                      alt={`${deployment.tick} token image`}
                      loading="lazy"
                      onError={() => setImgError(true)}
                    />
                  )
                  : (
                    <PlaceholderImage
                      variant="no-image"
                      className="!rounded-2xl"
                    />
                  )}
              </div>
              {/* Token name and social links */}
              <div class="flex">
                <h1 class={`${titlePrimary} uppercase`}>
                  {tickValue}
                </h1>
                <div class="flex gap-2 items-center">
                  {deployment.email && (
                    <Icon
                      type="iconButton"
                      name="email"
                      weight="normal"
                      size="xxs"
                      color="greyLight"
                      href={deployment.email}
                      target="_blank"
                    />
                  )}
                  {deployment.web && (
                    <Icon
                      type="iconButton"
                      name="website"
                      weight="normal"
                      size="xxs"
                      color="greyLight"
                      href={deployment.web}
                      target="_blank"
                    />
                  )}
                  {deployment.tg && (
                    <Icon
                      type="iconButton"
                      name="telegram"
                      weight="normal"
                      size="xxs"
                      color="greyLight"
                      href={deployment.tg}
                      target="_blank"
                    />
                  )}
                  {deployment.x && (
                    <Icon
                      type="iconButton"
                      name="twitter"
                      weight="normal"
                      size="xxs"
                      color="greyLight"
                      href={deployment.x}
                      target="_blank"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ===== PRICE + 24H CHANGE PILLS ===== */}
            <div class="flex items-center gap-2">
              <div class={`${containerPill} ${cardPrice} !text-sm`}>
                {floorPriceSatsFormatted}
              </div>
              <div
                class={`${containerPill} ${cardFileType} !text-sm ${
                  change24h === null
                    ? valueNeutral
                    : change24h >= 0
                    ? valuePositive
                    : valueNegative
                }`}
              >
                {change24h !== null
                  ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%`
                  : "N/A %"}
              </div>
            </div>

            {/* ===== VOLUME + MARKET CAP + SUPPLY ===== */}
            <div class="hidden min-[700px]:flex items-center gap-5">
              <StatItem
                label="VOLUME (24H)"
                value={volume24hBTCFormatted}
                align="left"
              />
              <StatItem
                label="MARKET CAP"
                value={marketCapBTCFormatted}
                class="text-right min-[800px]:text-center"
              />
              <StatItem
                label="SUPPLY"
                value={formatNumber(deployment.max ?? 0, 0)}
                align="right"
                class="hidden min-[800px]:block"
              />
            </div>
          </div>

          {/* ===== PRICE CHART ===== */}
          <div class="pt-3">
            <ChartWidget
              type="line"
              data={highcharts || []}
              fromPage="src20"
              tick={deployment.tick}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== INFO TAB CONTENT ===== */
/**
 * Renders the SRC-20 deploy metadata (creator, deploy date/block/tx, and
 * token parameters) that previously lived on the header. Rendered inside
 * the "INFO" tab of the Details selector on the SRC-20 detail page.
 */
export function SRC20DetailInfo({ deployment }: SRC20DetailInfoProps) {
  const deployDate = formatDate(new Date(deployment.block_time || 0), {
    month: "short",
    year: "numeric",
  });

  return (
    <div class="flex flex-wrap gap-6 justify-between w-full py-1">
      {/* ===== CREATOR ===== */}
      <div class="flex flex-col -space-y-0.5">
        <h6 class={labelSm}>
          CREATOR
        </h6>
        <h5 class="font-bold text-lg bg-gradient-to-r color-neutral-gradient color-gradient-hover tracking-wide">
          {deployment.creator_name ||
            abbreviateAddress(deployment.destination || "")}
        </h5>
      </div>

      {/* ===== DEPLOYMENT DETAILS ===== */}
      <div class="flex flex-col -space-y-0.5">
        <div class="flex items-center gap-1.5">
          <h5 class={labelSm}>
            DEPLOY
          </h5>
          <h6 class={valueSm}>
            {deployDate.toUpperCase()}
          </h6>
        </div>
        <div class="flex items-center gap-1.5">
          <h5 class={labelSm}>
            BLOCK #
          </h5>
          <h6 class={valueSm}>
            {deployment.block_index}
          </h6>
        </div>
        <div class="flex items-center gap-1.5">
          <h5 class={labelSm}>
            TX ID
          </h5>
          <h6 class={valueSm}>
            {deployment.tx_hash ? abbreviateAddress(deployment.tx_hash) : "N/A"}
          </h6>
        </div>
      </div>

      {/* ===== TOKEN PARAMETERS ===== */}
      <div class="flex flex-col -space-y-0.5 text-right">
        <div class="flex items-center gap-1.5 justify-end">
          <h5 class={labelSm}>
            DECIMALS
          </h5>
          <h6 class={valueSm}>
            {deployment.deci}
          </h6>
        </div>
        <div class="flex items-center gap-1.5 justify-end">
          <h5 class={labelSm}>
            LIMIT
          </h5>
          <h6 class={valueSm}>
            {deployment.lim !== undefined
              ? formatNumber(deployment.lim as number, 0)
              : "N/A"}
          </h6>
        </div>
        <div class="flex items-center gap-1.5 justify-end">
          <h5 class={labelSm}>
            SUPPLY
          </h5>
          <h6 class={valueSm}>
            {formatNumber(deployment.max ?? 0, 0)}
          </h6>
        </div>
      </div>
    </div>
  );
}
