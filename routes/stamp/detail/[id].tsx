/* ===== STAMP DETAILS PAGE ===== */
import { StampRow } from "$globals";
import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { fetchBTCPriceInUSD } from "$lib/utils/balanceUtils.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { StampController } from "$server/controller/stampController.ts";
import { DispenserManager } from "$server/services/xcpService.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { DOMParser } from "dom";
import { body } from "$layout";
import { StampImage, StampInfo, StampSection } from "$stamp";
import { HoldersGraph } from "$components/shared/HoldersGraph.tsx";
import Table from "$islands/shared/Tables.tsx";

/* ===== TYPES ===== */
interface StampData {
  stamp: StampRow & { name?: string };
  total: number;
  sends: any;
  dispensers: any;
  dispenses: any;
  holders: any[];
  vaults: any;
  last_block: number;
  stamps_recent: any;
  lowestPriceDispenser: any;
  htmlTitle?: string;
  error?: string;
  url: string;
}

interface StampDetailPageProps {
  data: StampData;
  url?: string;
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<StampData> = {
  async GET(req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const url = new URL(req.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      // Get stamp details first
      const stampData = await StampController.getStampDetailsById(id);
      if (!stampData?.data?.stamp) {
        return ctx.renderNotFound();
      }

      const encodedCpid = encodeURIComponent(stampData.data.stamp.cpid);
      const countParams = new URLSearchParams({
        limit: "20",
        sort: "DESC",
      });

      // Use the CPID from stamp data for other queries
      const [
        holders,
        mainCategories,
        dispensersCount,
        salesCount,
        transfersCount,
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
        fetch(
          `${baseUrl}/api/v2/stamps/${encodedCpid}/dispensers?${countParams}`,
        ).then((r) => r.json()),
        fetch(
          `${baseUrl}/api/v2/stamps/${encodedCpid}/dispenses?${countParams}`,
        ).then((r) => r.json()),
        fetch(`${baseUrl}/api/v2/stamps/${encodedCpid}/sends?${countParams}`)
          .then((r) => r.json()),
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
          dispensers: dispensersCount.total || 0,
          sales: salesCount.total || 0,
          transfers: transfersCount.total || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
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

/* ===== PAGE COMPONENT ===== */
export default function StampPage(props: StampDetailPageProps) {
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

  console.log("Initial data:", {
    dispensers: dispensers,
    dispenses: dispenses,
    sends: sends,
  });

  const totalCounts = {
    dispensers: dispensers?.length || 0,
    sales: dispenses?.length || 0,
    transfers: sends?.length || 0,
  };

  console.log("Total counts:", totalCounts);

  /* ===== META INFORMATION ===== */
  const title = htmlTitle
    ? htmlTitle.toUpperCase()
    : stamp?.cpid?.startsWith("A")
    ? `Bitcoin Stamp #${stamp?.stamp || ""} - stampchain.io`
    : stamp?.cpid || "Stamp Not Found";
  const stampImageUrl = stamp.stamp_url;

  // Update the getMetaImageInfo and add dimension handling
  const getMetaImageInfo = (stamp: StampRow | undefined, baseUrl: string) => {
    if (!stamp) {
      return {
        url: `${baseUrl}/default-stamp-image.png`, // You should add a default image
        width: 1200,
        height: 1200,
      };
    }

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

  const baseUrl = new URL(props.url || "").origin;
  const metaInfo = getMetaImageInfo(stamp, baseUrl);
  const metaDescription = stamp
    ? `Bitcoin Stamp #${stamp.stamp} - ${stamp.name || "Unprunable UTXO Art"}`
    : "Bitcoin Stamp - Unprunable UTXO Art";

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
      count: dispensers?.length || 0,
    },
    {
      id: "sales",
      count: dispenses?.length || 0,
    },
    {
      id: "transfers",
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
        <meta property="og:image" content={stampImageUrl} key="og-image" />
        <meta property="og:type" content="website" key="og-type" />
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
        <meta name="twitter:image" content={metaInfo.url} key="twitter-image" />
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

      <div class={body}>
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

        {holders && holders.length > 0 && (
          <HoldersGraph holders={holders || []} />
        )}

        <Table
          type="stamps"
          configs={tableConfigs}
          cpid={stamp.cpid}
        />

        <div class="pt-12 mobileLg:pt-24 desktop:pt-36">
          <StampSection {...latestStampsSection} />
        </div>
      </div>
    </>
  );
}
