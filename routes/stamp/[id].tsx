/* ===== STAMP DETAIL PAGE ===== */
/*@baba-365+390*/

import { StampImage, StampInfo } from "$content";
import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { body, containerBackground, containerGap } from "$layout";
import { logger, LogNamespace } from "$lib/utils/logger.ts";
import { StampGallery } from "$section";
import { StampController } from "$server/controller/stampController.ts";
import { CounterpartyDispenserService } from "$server/services/counterpartyApiService.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { DetailsTableBase, HoldersTable } from "$table";
import type { StampRow } from "$types/stamp.d.ts";
import type { StampDetailPageProps } from "$types/ui.d.ts";
import type { HolderRow } from "$types/wallet.d.ts";
import { DOMParser } from "dom";

/* ===== TYPES ===== */
interface StampData {
  stamp: StampRow & { name?: string };
  total: number;
  sends: any;
  dispensers: any;
  dispenses: any;
  holders: HolderRow[];
  vaults: any;
  last_block: number;
  stamps_recent: any;
  lowestPriceDispenser: any;
  htmlTitle?: string;
  error?: string;
  url: string;
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<StampData> = {
  async GET(req: Request, ctx) {
    try {
      const { id } = ctx.params;
      // Get stamp details first with market data
      const stampData = await StampController.getStampDetailsById(
        id,
        "all",
        RouteType.STAMP_DETAIL,
        undefined,
        true,
        false,
      );
      if (!stampData?.data?.stamp) {
        return ctx.renderNotFound();
      }

      // Log stamp data with market information
      await logger.debug("stamps" as LogNamespace, {
        message: "Stamp data fetched",
        stamp: stampData.data.stamp.stamp,
        cpid: stampData.data.stamp.cpid,
        floorPrice: stampData.data.stamp.floorPrice,
        floorPriceUSD: stampData.data.stamp.floorPriceUSD,
        hasMarketData: !!stampData.data.stamp.marketData,
      });

      // Use the CPID from stamp data for other queries
      const [
        holders,
        mainCategories,
      ] = await Promise.all([
        StampController.getStampHolders(
          stampData.data.stamp.cpid,
          1,
          1000000,
          RouteType.BALANCE,
        ),
        // Use the same pattern as getHomePageData
        StampController.getMultipleStampCategories([
          {
            idents: ["STAMP", "SRC-721"],
            limit: 12,
            type: "stamps",
            sortBy: "DESC",
          },
        ]),
      ]);

      // Log holders data structure
      await logger.debug("stamps" as LogNamespace, {
        message: "Holders data fetched",
        holdersLength: holders.data?.length || 0,
        hasHolders: holders.data && holders.data.length > 0,
      });

      // Only fetch dispensers for STAMP or SRC-721
      let dispensers = [];
      let lowestPriceDispenser = null;

      if (
        stampData.data.stamp.ident === "STAMP" ||
        stampData.data.stamp.ident === "SRC-721"
      ) {
        // Fetch dispensers separately for display on detail page
        const dispensersData = await CounterpartyDispenserService
          .getDispensersByCpid(
            stampData.data.stamp.cpid,
          );
        dispensers = dispensersData?.dispensers || [];
        lowestPriceDispenser = findLowestPriceDispenser(dispensers);
      }

      // Use market data from cache if available
      const stamp = stampData.data.stamp;

      // Stamp should already have market data from controller
      const stampWithPrices = stamp;

      let htmlTitle = null;
      if (
        stampWithPrices.stamp_mimetype === "text/html" &&
        stampWithPrices.stamp_url
      ) {
        const response = await fetch(stampWithPrices.stamp_url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        if (response.status === 200) {
          htmlTitle = doc.querySelector("title")?.textContent?.trim();
        }
      }

      return ctx.render({
        ...stampData.data,
        stamp: stampWithPrices,
        htmlTitle: htmlTitle,
        last_block: stampData.last_block,
        stamps_recent: mainCategories[0]?.stamps ?? [],
        holders: holders.data,
        lowestPriceDispenser: lowestPriceDispenser,
        url: req.url,
        initialCounts: {
          dispensers: 0,
          sales: 0,
          transfers: 0,
        },
      });
    } catch (error) {
      await logger.error("stamps" as LogNamespace, {
        message: "Error fetching stamp data",
        error: error instanceof Error ? error.message : String(error),
        stampId: ctx.params.id,
      });
      if ((error as Error).message?.includes("Stamp not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
        stamp: {} as StampRow,
        total: 0,
        sends: [],
        dispensers: [],
        dispenses: [],
        holders: [],
        vaults: [],
        last_block: 0,
        stamps_recent: [],
        lowestPriceDispenser: null,
        url: req.url,
      });
    }
  },
};

/* ===== HELPERS ===== */
// Helper functions to improve readability
function findLowestPriceDispenser(
  dispensers: Array<{
    give_remaining: number;
    satoshirate: number;
    close_block_index: number | null;
  }>,
): {
  give_remaining: number;
  satoshirate: number;
  close_block_index: number | null;
} | null {
  const openDispensers = dispensers?.filter((d) => d.give_remaining > 0) ?? [];
  return openDispensers.reduce<
    {
      give_remaining: number;
      satoshirate: number;
      close_block_index: number | null;
    } | null
  >(
    (lowest, dispenser) => {
      if (!lowest || dispenser.satoshirate < lowest.satoshirate) {
        return dispenser;
      }
      return lowest;
    },
    null,
  );
}

/* ===== PAGE COMPONENT ===== */
export default function StampDetailPage(props: StampDetailPageProps) {
  const {
    stamp,
    htmlTitle,
    dispensers,
    dispenses,
    sends,
    holders,
    stamps_recent,
    lowestPriceDispenser = null,
  } = props.data;

  /* ===== META INFORMATION ===== */
  const title = htmlTitle
    ? htmlTitle.toUpperCase()
    : stamp?.cpid?.startsWith("A")
    ? `Bitcoin Stamp #${stamp?.stamp ?? ""}`
    : stamp?.cpid ?? "Stamp Not Found";

  // Update the getMetaImageInfo and add dimension handling
  const getMetaImageInfo = (stamp: StampRow | undefined, baseUrl: string) => {
    if (!stamp) {
      return {
        url: `${baseUrl}/default-stamp-image.png`, // You should add a default image
        width: 1200,
        height: 1200,
      };
    }

    // For all content, use preview endpoint
    // Default to square (1200x1200) since most stamps are square
    return {
      url: `${baseUrl}/api/v2/stamp/${stamp.stamp}/preview`,
      width: 1200,
      height: 1200, // Square format works best for both X and Telegram
    };
  };

  // Ensure HTTPS for production preview URLs
  const baseUrl = new URL(props.url || "").origin.replace(/^http:/, "https:");
  const metaInfo = getMetaImageInfo(stamp, baseUrl);
  const metaDescription = stamp
    ? stamp.name || "Unprunable UTXO Art"
    : "Unprunable UTXO Art";

  /* ===== SECTION CONFIGURATION ===== */
  const latestStampsSection = {
    title: "LATEST STAMPS",
    subTitle: "ON-CHAIN MARVELS",
    type: "classic",
    stamps: stamps_recent,
    layout: "grid" as const,
    fromPage: "stamp_detail",
    showDetails: false,
    alignRight: false,
    gridClass: `
      grid w-full
      gap-3
      mobileMd:gap-6
      grid-cols-3
      mobileSm:grid-cols-3
      mobileMd:grid-cols-4
      mobileLg:grid-cols-5
      tablet:grid-cols-6
      desktop:grid-cols-8
      auto-rows-fr
    `,
    displayCounts: {
      "mobileSm": 3,
      "mobileMd": 4,
      "mobileLg": 5,
      "tablet": 6,
      "desktop": 8,
    },
  };

  const tableConfigs = [
    {
      id: "dispensers",
      label: "DISPENSERS",
      count: dispensers?.length || 0,
    },
    {
      id: "sales",
      label: "SALES",
      count: dispenses?.length || 0,
    },
    {
      id: "transfers",
      label: "TRANSFERS",
      count: sends?.length || 0,
    },
  ];

  /* ===== RENDER ===== */
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="og-title" />
        <meta
          property="og:description"
          content={metaDescription}
          key="og-description"
        />
        {/* Primary og:image - stamp preview (should override app-level meta tag) */}
        <meta property="og:image" content={metaInfo.url} key="og:image" />
        <meta property="og:type" content="website" key="og-type" />
        <meta
          property="og:url"
          content={(props.url || "").replace(/^http:/, "https:")}
          key="og-url"
        />
        <meta property="og:locale" content="en_US" key="og-locale" />
        <meta
          name="twitter:card"
          content="summary_large_image"
          key="twitter-card"
        />
        <meta name="twitter:title" content={title} key="twitter-title" />
        <meta
          name="twitter:description"
          content={metaDescription}
          key="twitter-description"
        />
        {/* Primary twitter:image - stamp preview (should override app-level meta tag) */}
        <meta name="twitter:image" content={metaInfo.url} key="twitter:image" />
        <meta
          name="twitter:image:alt"
          content={`Bitcoin Stamp #${stamp?.stamp || ""}`}
          key="twitter:image:alt"
        />
        {/* Always use 1200x1200 for all stamps */}
        <meta
          property="og:image:width"
          content="1200"
          key="og:image:width"
        />
        <meta
          property="og:image:height"
          content="1200"
          key="og:image:height"
        />
      </Head>

      <div class={`${body} ${containerGap}`}>
        <div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6 mobileLg:gap-9">
          <div class="desktop:col-span-1">
            {stamp &&
              (
                <StampImage
                  stamp={stamp}
                  flag
                />
              )}
          </div>
          <div class="desktop:col-span-2">
            {stamp &&
              (
                <StampInfo
                  stamp={stamp}
                  lowestPriceDispenser={lowestPriceDispenser}
                />
              )}
          </div>
        </div>

        {holders && holders.length > 0 && (
          <HoldersTable
            holders={holders.map((holder) => ({
              quantity: Number(holder.quantity),
              divisible: holder.divisible,
              address: holder.address,
              amt: Number(holder.amt ?? 0),
              percentage: Number(holder.percentage ?? 0),
            }))}
          />
        )}

        {stamp?.ident !== "SRC-20" && (
          <DetailsTableBase
            type="stamps"
            configs={tableConfigs}
            cpid={stamp?.cpid || ""}
          />
        )}

        <div class={containerBackground}>
          <StampGallery {...latestStampsSection} />
        </div>
      </div>
    </>
  );
}
