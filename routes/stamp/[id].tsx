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

// Update CollectionRow interface to be simpler since we only need basic info
interface CollectionRow {
  collection_id: string;
  name: string;
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
      const [holders, recentStamps] = await Promise.all([
        StampController.getStampHolders(
          stampData.data.stamp.cpid, // Use CPID directly
          1,
          1000000,
          RouteType.BALANCE,
        ),
        StampController.getStamps({
          limit: 12,
          page: 1,
        }),
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

        // Find the lowest price open dispenser
        const openDispensers = dispensers.filter((d) => d.give_remaining > 0);
        lowestPriceDispenser = openDispensers.reduce(
          (lowest, dispenser) => {
            if (!lowest || dispenser.satoshirate < lowest.satoshirate) {
              return dispenser;
            }
            return lowest;
          },
          null,
        );

        // Calculate floor price from lowest price dispenser
        floorPrice = lowestPriceDispenser
          ? Number(
            formatSatoshisToBTC(lowestPriceDispenser.satoshirate, {
              includeSymbol: false,
            }),
          )
          : null;
      }

      const btcPrice = await fetchBTCPriceInUSD(url.origin);

      // Calculate USD values
      const stampWithPrices = {
        ...stampData.data.stamp,
        floorPrice,
        floorPriceUSD: floorPrice !== null ? floorPrice * btcPrice : null,
        marketCapUSD: typeof stampData.data.stamp.marketCap === "number"
          ? stampData.data.stamp.marketCap * btcPrice
          : null,
      };

      const calculateHoldersWithPercentage = (rawHolders: Holder[]) => {
        const totalQuantity = rawHolders.reduce(
          (sum, holder) => sum + holder.quantity,
          0,
        );
        return rawHolders.map((holder) => ({
          ...holder,
          amt: holder.quantity, // Add amt for compatibility
          percentage: Number(
            ((holder.quantity / totalQuantity) * 100).toFixed(2),
          ),
        }));
      };

      return ctx.render({
        ...stampData.data,
        stamp: stampWithPrices,
        last_block: stampData.last_block,
        stamps_recent: recentStamps?.data || [],
        holders: calculateHoldersWithPercentage(holders.data),
        lowestPriceDispenser: lowestPriceDispenser,
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
        <meta
          property="og:description"
          content="Unprunable UTXO Art, Because Sats Don't Exist"
        />
        <meta property="og:image" content={stamp.stamp_url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
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
