import { StampRow } from "$globals";

import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import { HoldersGraph } from "$components/shared/HoldersGraph.tsx";

import { StampImage } from "$islands/stamp/details/StampImage.tsx";
import { StampInfo } from "$islands/stamp/details/StampInfo.tsx";
import { StampRelatedInfo } from "$islands/stamp/details/StampRelatedInfo.tsx";
import StampSection from "$islands/stamp/StampSection.tsx";

import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

import { StampController } from "$server/controller/stampController.ts";
import { DispenserManager } from "$server/services/xcpService.ts";
import { RouteType } from "$server/services/cacheService.ts";

interface Holder {
  address: string | null;
  quantity: number;
  amt: number;
  percentage: number;
}

interface StampDetailPageProps {
  data: {
    stamp: StampRow;
    total: number;
    sends: any;
    dispensers: any;
    dispenses: any;
    holders: any;
    vaults: any;
    last_block: number;
    stamps_recent: any;
    lowestPriceDispenser: any; // Add this property
  };
}

interface StampData {
  stamp: StampRow;
  total: number;
  sends: any;
  dispensers: any;
  dispenses: any;
  holders: any;
  last_block: number;
  stamps_recent: any;
  lowestPriceDispenser: any;
}

export const handler: Handlers<StampData> = {
  async GET(req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(req.url);

      // Get stamp details first
      const stampData = await StampController.getStampDetailsById(id);
      if (!stampData?.data?.stamp) {
        return ctx.renderNotFound();
      }

      // Use the CPID from stamp data for other queries
      const [holders, mainCategories] = await Promise.all([
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

      // Only fetch dispensers for STAMP or SRC-721
      let dispensers = [];
      let lowestPriceDispenser = null;
      let floorPrice = null;

      if (
        stampData.data.stamp.ident === "STAMP" ||
        stampData.data.stamp.ident === "SRC-721"
      ) {
        // Fetch dispensers separately
        const dispensersData = await DispenserManager.getDispensersByCpid(
          stampData.data.stamp.cpid,
        );
        dispensers = dispensersData?.dispensers || [];
        lowestPriceDispenser = findLowestPriceDispenser(dispensers);
        floorPrice = calculateFloorPrice(lowestPriceDispenser);
      }

      const btcPrice = await fetchBTCPriceInUSD(url.origin);
      const stampWithPrices = addPricesToStamp(
        stampData.data.stamp,
        floorPrice,
        btcPrice,
      );

      const calculateHoldersWithPercentage = (rawHolders: Holder[]) => {
        const totalQuantity = rawHolders.reduce(
          (sum, holder) => sum + holder.quantity,
          0,
        );
        return rawHolders.map((holder) => ({
          ...holder,
          amt: holder.quantity,
          percentage: Number(
            ((holder.quantity / totalQuantity) * 100).toFixed(2),
          ),
        }));
      };

      return ctx.render({
        ...stampData.data,
        stamp: stampWithPrices,
        last_block: stampData.last_block,
        stamps_recent: mainCategories[0]?.stamps ?? [], // Use the stamps from mainCategories
        holders: calculateHoldersWithPercentage(holders.data),
        lowestPriceDispenser: lowestPriceDispenser,
        url: req.url,
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      if ((error as Error).message?.includes("Stamp not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

// Helper functions to improve readability
function findLowestPriceDispenser(dispensers: any[]) {
  const openDispensers = dispensers.filter((d) => d.give_remaining > 0);
  return openDispensers.reduce(
    (lowest, dispenser) => {
      if (!lowest || dispenser.satoshirate < lowest.satoshirate) {
        return dispenser;
      }
      return lowest;
    },
    null,
  );
}

function calculateFloorPrice(dispenser: any) {
  return dispenser
    ? Number(
      formatSatoshisToBTC(dispenser.satoshirate, {
        includeSymbol: false,
      }),
    )
    : null;
}

function addPricesToStamp(
  stamp: any,
  floorPrice: number | null,
  btcPrice: number,
) {
  return {
    ...stamp,
    floorPrice,
    floorPriceUSD: floorPrice !== null ? floorPrice * btcPrice : null,
    marketCapUSD: typeof stamp.marketCap === "number"
      ? stamp.marketCap * btcPrice
      : null,
  };
}

export default function StampPage(props: StampDetailPageProps) {
  const {
    stamp,
    holders,
    sends,
    stamps_recent,
    dispensers = [],
    dispenses = [],
    lowestPriceDispenser = null,
  } = props.data;

  const title = stamp.name
    ? `${stamp.name}`
    : `Bitcoin Stamp #${stamp.stamp} - stampchain.io`;

  // Update the getMetaImageUrl and add dimension handling
  const getMetaImageInfo = (stamp: StampRow, baseUrl: string) => {
    // For HTML/SVG content, use preview endpoint with known dimensions
    if (
      stamp.stamp_mimetype === "text/html" ||
      stamp.stamp_mimetype === "image/svg+xml"
    ) {
      return {
        url: `${baseUrl}/api/v2/stamp/${stamp.stamp}/preview`,
        width: 1200,
        height: 1200,
      };
    }

    // For direct images, use original URL and dimensions
    return {
      url: stamp.stamp_url,
    };
  };

  const baseUrl = new URL(props.url).origin;
  const metaInfo = getMetaImageInfo(stamp, baseUrl);
  const metaDescription = `Bitcoin Stamp #${stamp.stamp} - ${
    stamp.name || "Unprunable UTXO Art"
  }`;

  const bodyClassName = "flex flex-col gap-6";

  const latestStampsSection = {
    title: "LATEST STAMPS",
    subTitle: "ON-CHAIN MARVELS",
    type: "classic",
    stamps: stamps_recent,
    layout: "grid" as const,
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

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaInfo.url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaInfo.url} />
        {/* Only add dimension meta tags if we have the dimensions */}
        {metaInfo.width && metaInfo.height && (
          <>
            <meta
              property="og:image:width"
              content={metaInfo.width.toString()}
            />
            <meta
              property="og:image:height"
              content={metaInfo.height.toString()}
            />
          </>
        )}
      </Head>

      <div class={bodyClassName}>
        <div class="grid grid-cols-1 min-[880px]:grid-cols-2 desktop:grid-cols-3 gap-3 mobileMd:gap-6">
          <div class="desktop:col-span-1">
            <StampImage
              stamp={stamp}
              flag={true}
            />
          </div>
          <div class="desktop:col-span-2">
            <StampInfo
              stamp={stamp}
              lowestPriceDispenser={lowestPriceDispenser}
            />
          </div>
        </div>

        <HoldersGraph holders={holders || []} />

        <StampRelatedInfo
          stampId={stamp.stamp?.toString() || ""}
          cpid={stamp.cpid}
        />

        <div class="pt-12 mobileLg:pt-24 desktop:pt-36">
          <StampSection {...latestStampsSection} />
        </div>
      </div>
    </>
  );
}
